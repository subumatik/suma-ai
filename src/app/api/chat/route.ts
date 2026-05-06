import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, case_id } = await req.json();

    if (!case_id) {
      return new Response("case_id is required", { status: 400 });
    }

    // Normalize messages to Anthropic format
    const apiMessages = messages
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
      .from('dosya_documents')
      .select('file_name, claude_file_id')
      .eq('dosya_id', case_id)
      .not('claude_file_id', 'is', null);

    if (docsError) {
      console.error("Docs fetch error:", docsError);
    }

    // Build document blocks for Claude
    // @ts-ignore — beta file source not yet in SDK types
    const documentBlocks = (docs || []).map((doc: any) => ({
      type: "document",
      source: { type: "file", file_id: doc.claude_file_id },
      title: doc.file_name,
      citations: { enabled: true },
    }));

    // Add documents to the latest user message
    const latestUserMessage = apiMessages[apiMessages.length - 1];
    if (latestUserMessage && latestUserMessage.role === "user") {
      latestUserMessage.content = [
        ...(documentBlocks.length > 0 ? documentBlocks : []),
        { type: "text", text: latestUserMessage.content },
      ];
    }

    const systemPrompt = `Sen profesyonel bir yapay zeka avukat asistanısın.
Kullanıcının davasına ait yüklenmiş belgeleri okuyarak sorularını cevapla.
Eğer belgelerde sorunun cevabı yoksa, "Bu bilgiyi yüklenen dosyalarda bulamadım" şeklinde cevap ver. Asla belge dışı bilgi uydurma.
Profesyonel, net ve Türkçe yanıt ver.`;

    const stream = client.beta.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: systemPrompt,
      messages: apiMessages,
      betas: ["files-api-2025-04-14"],
    });

    // Convert SDK stream to SSE Response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const sse = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(sse));
            }

          }
        } catch (streamError: any) {
          console.error("Stream error:", streamError);
          const sse = `data: ${JSON.stringify({ error: streamError.message })}\n\n`;
          controller.enqueue(encoder.encode(sse));
        } finally {
          controller.close();
        }
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
