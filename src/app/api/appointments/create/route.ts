import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { lawyer_id, client_id, dosya_id, appointment_date, duration_minutes, topic, notes, status } = body;

    if (!lawyer_id || !client_id || !appointment_date || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify lawyer-client connection via junction tables
    const { data: lawyerCases } = await supabase
      .from('dosya_lawyers')
      .select('dosya_id')
      .eq('lawyer_id', lawyer_id);
    const lawyerCaseIds = (lawyerCases ?? []).map((c) => c.dosya_id);

    if (lawyerCaseIds.length === 0) {
      return NextResponse.json({ error: 'Bu avukatla bağlantınız bulunmamaktadır.' }, { status: 403 });
    }

    const { data: connection } = await supabase
      .from('dosya_clients')
      .select('dosya_id')
      .eq('client_id', client_id)
      .in('dosya_id', lawyerCaseIds)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ error: 'Bu avukatla bağlantınız bulunmamaktadır.' }, { status: 403 });
    }

    const appointmentStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'REQUESTED';

    // Insert appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        lawyer_id,
        client_id,
        dosya_id: dosya_id || null,
        appointment_date,
        duration_minutes: duration_minutes ?? 60,
        topic,
        notes,
        status: appointmentStatus,
      })
      .select('*, lawyer:lawyer_id(full_name, email), client:client_id(full_name, email)')
      .single();

    if (insertError || !appointment) {
      console.error('Appointment insert error:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Insert failed' }, { status: 500 });
    }

    // Send emails to both parties
    const lawyer = appointment.lawyer as any;
    const client = appointment.client as any;
    const dateStr = new Date(appointment.appointment_date).toLocaleString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    if (appointmentStatus === 'CONFIRMED') {
      // Lawyer created a confirmed appointment directly
      try {
        if (client?.email) {
          await sendAppointmentEmail(
            client.email,
            'Randevunuz Oluşturuldu',
            'Randevunuz Oluşturuldu',
            [
              `<strong>${lawyer?.full_name || 'Avukat'}</strong> sizin için bir randevu oluşturdu.`,
              `<strong>Konu:</strong> ${topic}`,
              `<strong>Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${appointment.duration_minutes} dakika`,
              notes ? `<strong>Notlar:</strong> ${notes}` : '',
              `Randevu saatinde hazır bulunmayı unutmayın.`,
            ].filter(Boolean)
          );
        }
      } catch (e: any) {
        console.error('Client email error:', e.message);
      }
    } else {
      // Client requested an appointment
      try {
        if (lawyer?.email) {
          await sendAppointmentEmail(
            lawyer.email,
            'Yeni Randevu Talebi',
            'Yeni Randevu Talebi',
            [
              `<strong>${client?.full_name || 'Bir müvekkil'}</strong> sizden randevu talep etti.`,
              `<strong>Konu:</strong> ${topic}`,
              `<strong>Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${appointment.duration_minutes} dakika`,
              notes ? `<strong>Notlar:</strong> ${notes}` : '',
              `Randevuyu onaylamak veya reddetmek için platforma giriş yapabilirsiniz.`,
            ].filter(Boolean)
          );
        }
      } catch (e: any) {
        console.error('Lawyer email error:', e.message);
      }

      try {
        if (client?.email) {
          await sendAppointmentEmail(
            client.email,
            'Randevu Talebiniz Alındı',
            'Randevu Talebiniz Alındı',
            [
              `<strong>${lawyer?.full_name || 'Avukat'}</strong> için randevu talebiniz oluşturuldu.`,
              `<strong>Konu:</strong> ${topic}`,
              `<strong>Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${appointment.duration_minutes} dakika`,
              `Avukat talebinizi onayladığında bilgilendirileceksiniz.`,
            ]
          );
        }
      } catch (e: any) {
        console.error('Client email error:', e.message);
      }
    }

    // Create notifications
    const notifications = [];
    if (appointmentStatus === 'CONFIRMED') {
      notifications.push({
        user_id: client_id,
        type: 'appointment',
        title: 'Randevunuz oluşturuldu',
        message: `${lawyer?.full_name || 'Avukat'} sizin için randevu oluşturdu: ${topic}`,
        related_id: appointment.id,
      });
    } else {
      notifications.push({
        user_id: lawyer_id,
        type: 'appointment',
        title: 'Yeni randevu talebi',
        message: `${client?.full_name || 'Bir müvekkil'} randevu talep etti: ${topic}`,
        related_id: appointment.id,
      });
      notifications.push({
        user_id: client_id,
        type: 'appointment',
        title: 'Randevu talebiniz alındı',
        message: `${lawyer?.full_name || 'Avukat'} için randevu talebiniz oluşturuldu.`,
        related_id: appointment.id,
      });
    }

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Create appointment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
