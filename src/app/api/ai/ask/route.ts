import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedis } from '@/lib/upstash/redis';

function hashQuestion(q: string): string {
  let hash = 0;
  for (let i = 0; i < q.length; i++) {
    const char = q.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const { dosyaId, question } = body;
    if (!dosyaId || !question?.trim()) {
      return NextResponse.json({ error: 'Dosya ID ve soru zorunludur' }, { status: 400 });
    }

    const cacheKey = `ai:${dosyaId}:${hashQuestion(question.trim().toLowerCase())}`;

    // 1. Redis cache kontrolü
    try {
      const cached = await getRedis().get<string>(cacheKey);
      if (cached) {
        return NextResponse.json({ answer: cached, cached: true });
      }
    } catch {
      // Cache hatası durumunda devam et
    }

    // 2. Dosya verilerini çek
    const [{ data: dosya }, { data: documents }, { data: statusUpdates }, { data: messages }] = await Promise.all([
      supabase.from('dosyalar').select('*, client:client_id(full_name), lawyer:lawyer_id(full_name), category:category_id(name), status:status_id(name)').eq('id', dosyaId).single(),
      supabase.from('dosya_documents').select('file_name, description, created_at').eq('dosya_id', dosyaId).order('created_at', { ascending: false }).limit(20),
      supabase.from('dosya_status_updates').select('*, status:status_id(name)').eq('dosya_id', dosyaId).order('created_at', { ascending: false }).limit(20),
      supabase.from('messages').select('content, sender_id, created_at').eq('dosya_id', dosyaId).order('created_at', { ascending: false }).limit(20),
    ]);

    if (!dosya) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 });
    }

    // 3. Context oluştur
    let context = `DOSYA BİLGİLERİ:\n`;
    context += `Başlık: ${dosya.title}\n`;
    context += `Dosya No: ${dosya.file_number ?? 'Belirtilmemiş'}\n`;
    context += `Kategori: ${dosya.category?.name ?? 'Belirtilmemiş'}\n`;
    context += `Durum: ${dosya.status?.name ?? 'Belirtilmemiş'}\n`;
    context += `Mahkeme: ${dosya.court_name ?? 'Belirtilmemiş'}\n`;
    context += `Mahkeme Dosya No: ${dosya.court_file_no ?? 'Belirtilmemiş'}\n`;
    context += `Avukat: ${dosya.lawyer?.full_name ?? 'Bilinmiyor'}\n`;
    context += `Müvekkil: ${dosya.client?.full_name ?? 'Bilinmiyor'}\n`;
    context += `Açıklama: ${dosya.description ?? 'Yok'}\n\n`;

    if (documents && documents.length > 0) {
      context += `BELGELER (${documents.length} adet):\n`;
      documents.forEach((doc, i) => {
        context += `${i + 1}. ${doc.file_name}${doc.description ? ` - ${doc.description}` : ''}\n`;
      });
      context += `\n`;
    }

    if (statusUpdates && statusUpdates.length > 0) {
      context += `DURUM GEÇMİŞİ:\n`;
      statusUpdates.forEach((su) => {
        context += `- ${su.status?.name ?? '-'}: ${su.description ?? 'Açıklama yok'} (${new Date(su.created_at).toLocaleDateString('tr-TR')})\n`;
      });
      context += `\n`;
    }

    if (messages && messages.length > 0) {
      context += `SON MESAJLAR:\n`;
      messages.forEach((m) => {
        context += `- ${m.sender_id === dosya.lawyer_id ? 'Avukat' : 'Müvekkil'}: ${m.content}\n`;
      });
      context += `\n`;
    }

    const systemPrompt = `Sen bir hukuki asistansın. Sana verilen dosya bilgilerini, belgeleri, durum geçmişini ve mesajları analiz ederek avukata yardımcı oluyorsun. Cevaplarını Türkçe ver. Sadece verilen bilgilere dayan, spekülasyon yapma. Eksik bilgi varsa belirt.`;

    // 4. Claude API çağrısı
    const apiKey = process.env.anthropic_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI servisi yapılandırılmamış' }, { status: 500 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `${context}\n\nSORU: ${question.trim()}` },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Claude API hatası: ${err}` }, { status: 502 });
    }

    const aiData = await res.json();
    const answer = aiData.content?.[0]?.text ?? 'Cevap alınamadı.';

    // 5. Redis cache'e kaydet (1 saat TTL)
    try {
      await getRedis().setex(cacheKey, 3600, answer);
    } catch {
      // Cache hatası sessizce devam et
    }

    return NextResponse.json({ answer, cached: false });
  } catch (error: any) {
    console.error('AI ask error:', error);
    return NextResponse.json({ error: error?.message ?? 'Bir hata oluştu' }, { status: 500 });
  }
}
