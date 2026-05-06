import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchAndFetchDetails } from "@/lib/yargitay";

export const maxDuration = 300;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const searchYargitayTool: Anthropic.Tool = {
  name: "search_yargitay",
  description:
    "Yargıtay kararlarını arar. Hukuki bir konu veya dava konusu verilerek ilgili Yargıtay içtihat kararlarını bulur. " +
    "ÖNEMLİ: Çok genel terimler KULLANMA. Örneğin 'hukuk' 6 milyon, 'ceza' 5 milyon sonuç döndürür ve işe yaramaz. " +
    "Bunun yerine davaya özel SPESİFİK terimler kullan: 'tapu iptal tescil', 'iş kazası tazminat', 'mal rejimi mal paylaşımı', " +
    "'borçlu temerrüt faiz', 'işçi kıdem tazminatı haksız fesih', 'kat irtifakı tapu iptali' gibi. " +
    "Eğer dosyada belirli bir daire veya tarih geçiyorsa bunları da query'e ekle. " +
    "maxResults en fazla 3 olmalı; detay çekme sınırlıdır. Tool sonucunda her kararın ham içtihat metni de gelir, onları okuyup analiz et.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Aranacak SPESİFİK hukuki terim veya dava konusu. Çok genel kelimelerden kaçın. " +
          "Örn: 'tapu iptal tescil', 'işçi kıdem tazminatı haksız fesih', 'mal rejimi mal paylaşımı edinilmiş mallara katılma', " +
          "'borçlu temerrüt faiz', 'iş kazası tazminatı', 'miras tenkis', 'kat irtifakı tapu iptali'",
      },
      maxResults: {
        type: "integer",
        description: "En fazla kaç kararın detayı çekilecek. En fazla 3. Varsayılan 2.",
      },
    },
    required: ["query"],
  },
};

async function executeYargitaySearch(
  input: Record<string, unknown>
): Promise<string> {
  const query = String(input.query ?? "");
  const maxResults = Math.min(Number(input.maxResults ?? 2), 3);

  if (!query) {
    return "Hata: Arama sorgusu boş.";
  }

  try {
    const result = await searchAndFetchDetails(query, 10, maxResults);

    let output = `Yargıtay'da "${query}" araması sonucu toplam ${result.total.toLocaleString()} karar bulundu. `;
    output += `İlk ${result.decisions.length} sonuç şunlardır:\n\n`;

    for (const d of result.decisions) {
      output += `=== Karar #${d.siraNo} ===\n`;
      output += `Daire: ${d.daire}\n`;
      output += `Esas No: ${d.esasNo}\n`;
      output += `Karar No: ${d.kararNo}\n`;
      output += `Tarih: ${d.kararTarihi}\n`;
      if (d.detail) {
        output += `\n--- İçtihat Metni (HTML'den çıkarılmış ham metin) ---\n${d.detail}\n`;
      } else {
        output += `Detay: Detay çekilemedi (rate limit).\n`;
      }
      output += `\n`;
    }

    return output;
  } catch (err: any) {
    return `Yargıtay arama hatası: ${err.message ?? String(err)}`;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, case_id } = await req.json();

    if (!case_id) {
      return new Response("case_id is required", { status: 400 });
    }

    // Normalize messages to Anthropic format
    const apiMessages: Anthropic.MessageParam[] = messages
      .map((m: any) => ({
        role: m.role,
        content:
          m.content !== undefined
            ? m.content
            : m.parts
              ? m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("")
              : "",
      }))
      .filter((m: any) => m.role === "user" || m.role === "assistant");

    // Fetch documents with claude_file_id for this case
    const { data: docs, error: docsError } = await supabase
      .from("dosya_documents")
      .select("file_name, claude_file_id")
      .eq("dosya_id", case_id)
      .not("claude_file_id", "is", null);

    if (docsError) {
      console.error("Docs fetch error:", docsError);
    }

    // Build document blocks for Claude
    const documentBlocks = (docs || []).map((doc: any) => ({
      type: "document" as const,
      source: { type: "file" as const, file_id: doc.claude_file_id },
      title: doc.file_name,
      citations: { enabled: true },
    }));

    function getUserTextFromContent(content: any): string {
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        const textPart = content.find((c: any) => c.type === "text");
        return textPart?.text ?? "";
      }
      return "";
    }

    function setUserTextInContent(content: any, newText: string): any {
      if (typeof content === "string") return newText;
      if (Array.isArray(content)) {
        return content.map((c: any) => (c.type === "text" ? { ...c, text: newText } : c));
      }
      return newText;
    }

    // Find the actual latest user message (not just the last message in the array,
    // which could be an assistant reply from a prior turn)
    const latestUserMessage = apiMessages.filter((m: any) => m.role === "user").pop();

    // Extract the original user text before we overwrite the content array
    const latestUserText = latestUserMessage
      ? getUserTextFromContent(latestUserMessage.content)
      : "";

    // Inject document blocks into the latest user message, preserving the text
    if (latestUserMessage) {
      (latestUserMessage as any).content = [
        ...(documentBlocks.length > 0 ? documentBlocks : []),
        { type: "text" as const, text: latestUserText },
      ];
    }

    const wantsYargitay = latestUserText.toLowerCase().includes("@yargitay_sorgula");

    const systemPrompt = `Sen profesyonel bir yapay zeka avukat asistanısın.
Kullanıcının davasına ait yüklenmiş belgeleri okuyarak sorularını cevapla.

Kullanıcı mesajında "@yargitay_sorgula" yazarsa, bu kesinlikle Yargıtay kararı araması isteğidir.
"@yargitay_sorgula" komutunu gördüğünde DURDUR ve HEMEN search_yargitay aracını çağır.
Kullanıcının yazdığı konuyu (örneğin "sigorta", "işçi kıdem tazminatı" vb.) direkt olarak search_yargitay aracının query parametresine yaz.
Kullanıcıya açıklama yapma, bekleme, öneri verme. ARACI HEMEN ÇAĞIR.

Profesyonel, net ve Türkçe yanıt ver. Asla uydurma bilgi verme.`;

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let currentMessages = [...apiMessages];
        const MAX_ITERATIONS = 3;

        let passTool = wantsYargitay;

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          const stream = client.beta.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 64000,
            system: systemPrompt,
            tools: passTool ? [searchYargitayTool] : [],
            messages: currentMessages,
            betas: ["files-api-2025-04-14"],
          });

          stream.on("text", (delta) => {
            const sse = `data: ${JSON.stringify({ text: delta })}\n\n`;
            controller.enqueue(encoder.encode(sse));
          });

          let message: any;
          try {
            message = await stream.finalMessage();
          } catch (err: any) {
            console.error("Stream finalMessage error:", err);
            const sse = `data: ${JSON.stringify({
              text: "\n\n[Asistan yanıt üretirken bir hata oluştu. Lütfen tekrar deneyin.]\n",
            })}\n\n`;
            controller.enqueue(encoder.encode(sse));
            break;
          }

          if (
            message.stop_reason === "end_turn" ||
            message.stop_reason === "max_tokens"
          ) {
            break;
          }

          if (message.stop_reason === "tool_use") {
            const notifyText = passTool ? "\n\n🔍 Yargıtay kararları aranıyor...\n\n" : "\n\n[İşlem yapılıyor...]\n\n";
            const sse = `data: ${JSON.stringify({ text: notifyText })}\n\n`;
            controller.enqueue(encoder.encode(sse));

            const toolUseBlocks = message.content.filter(
              (b: any) => b.type === "tool_use"
            );

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const tool of toolUseBlocks) {
              if (tool.name === "search_yargitay") {
                const result = await executeYargitaySearch(
                  tool.input as Record<string, unknown>
                );
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tool.id,
                  content: result,
                });
              } else {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tool.id,
                  content: `Bilinmeyen araç: ${tool.name}`,
                });
              }
            }

            currentMessages.push({
              role: "assistant",
              content: message.content,
            });
            currentMessages.push({ role: "user", content: toolResults });

            passTool = false;
            continue;
          }

          break;
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
