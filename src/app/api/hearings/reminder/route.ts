import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { hearing_id } = await req.json();
    if (!hearing_id) return NextResponse.json({ error: 'hearing_id gerekli' }, { status: 400 });

    const { data: hearing } = await supabase
      .from('hearings')
      .select('*, dosya:dosya_id(title, lawyer_id, client_id, lawyer:lawyer_id(full_name, email), client:client_id(full_name, email))')
      .eq('id', hearing_id)
      .single();

    if (!hearing) return NextResponse.json({ error: 'Duruşma bulunamadı' }, { status: 404 });

    const dosya = hearing.dosya as any;
    if (dosya.lawyer_id !== user.id) {
      return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 });
    }

    const dateStr = new Date(hearing.hearing_date).toLocaleString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const subject = `Duruşma Hatırlatması - ${dosya.title || 'Dosya'}`;
    const body = `
      <p><strong>${dosya.title || 'Dosyanız'}</strong> için duruşma hatırlatması:</p>
      <p><strong>Tarih:</strong> ${dateStr}</p>
      ${hearing.court_name ? `<p><strong>Mahkeme:</strong> ${hearing.court_name}</p>` : ''}
      ${hearing.description ? `<p><strong>Açıklama:</strong> ${hearing.description}</p>` : ''}
      <p>Hazırlıklı olun ve duruşma saatinden önce dosyanızı kontrol edin.</p>
    `;

    const sentTo: string[] = [];

    if (dosya.lawyer?.email) {
      await sendEmail(dosya.lawyer.email, subject, 'Duruşma Hatırlatması', body);
      sentTo.push(dosya.lawyer.email);
    }

    if (dosya.client?.email) {
      await sendEmail(dosya.client.email, subject, 'Duruşma Hatırlatması', body);
      sentTo.push(dosya.client.email);
    }

    await supabase.from('hearings').update({ reminder_email_sent: true }).eq('id', hearing_id);

    return NextResponse.json({ success: true, sentTo });
  } catch (error: any) {
    console.error('Reminder API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
