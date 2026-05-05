import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { queryDocumentContext } from '@/lib/vector';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

// Initialize anthropic with case-insensitive API key fallback
const apiKey = (process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || '').trim();
const anthropic = createAnthropic({
  apiKey,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, case_id } = await req.json();

    if (!case_id) {
      return new Response('case_id is required', { status: 400 });
    }

    // 1. Normalize messages from frontend to standard CoreMessage format
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content !== undefined ? m.content : (m.parts ? m.parts.map((p: any) => p.type === 'text' ? p.text : '').join('') : '')
    }));

    // 2. Get the latest user query
    const latestMessage = coreMessages[coreMessages.length - 1];
    const userQuery = latestMessage.content;

    // 2. Query Upstash Vector for relevant context
    let contextTexts = '';
    try {
      const results = await queryDocumentContext(case_id, userQuery, 5);
      contextTexts = results.map(r => r.data).join('\n\n');
    } catch (err: any) {
      console.error('Vector search error:', err.message);
    }

    // 3. Prepare the system prompt
    const systemPrompt = `Sen profesyonel bir yapay zeka avukat asistanısın.
Kullanıcının davasına (case) ait yüklenmiş olan belgelerden çıkarılan bağlam (context) aşağıdadır:

<context>
${contextTexts || 'Bu dosya için aranabilir bir belge metni bulunamadı.'}
</context>

Kullanıcının sorusunu YALNIZCA yukarıdaki bağlamı kullanarak cevapla. Eğer bağlamda sorunun cevabı yoksa, "Bu bilgiyi yüklenen dosyalarda bulamadım" şeklinde cevap ver. Asla bağlam dışı bilgi uydurma (halüsinasyon görme).
Profesyonel, net ve Türkçe yanıt ver.`;

    // 4. Stream response from Anthropic Claude
    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
