import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { appointment_id, appointment_date, duration_minutes, topic, notes, sendEmail } = body;

    if (!appointment_id || !appointment_date || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current appointment with emails
    const { data: current, error: fetchError } = await supabase
      .from('appointments')
      .select('*, lawyer:lawyer_id(full_name, email), client:client_id(full_name, email)')
      .eq('id', appointment_id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update appointment
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        appointment_date,
        duration_minutes: duration_minutes ?? 60,
        topic,
        notes: notes || null,
      })
      .eq('id', appointment_id)
      .select('*, lawyer:lawyer_id(full_name, email), client:client_id(full_name, email)')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message || 'Update failed' }, { status: 500 });
    }

    const lawyer = updated.lawyer as any;
    const client = updated.client as any;
    const dateStr = new Date(updated.appointment_date).toLocaleString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Send emails if requested
    if (sendEmail) {
      try {
        if (client?.email) {
          await sendAppointmentEmail(
            client.email,
            'Randevu Saatiniz Değişti',
            'Randevu Saatiniz Değişti',
            [
              `<strong>${lawyer?.full_name || 'Avukat'}</strong> randevu saatinizi güncelledi.`,
              `<strong>Konu:</strong> ${updated.topic}`,
              `<strong>Yeni Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${updated.duration_minutes} dakika`,
              updated.notes ? `<strong>Notlar:</strong> ${updated.notes}` : '',
              `Randevu saatinde hazır bulunmayı unutmayın.`,
            ].filter(Boolean)
          );
        }
      } catch (e: any) {
        console.error('Client email error:', e.message);
      }

      try {
        if (lawyer?.email) {
          await sendAppointmentEmail(
            lawyer.email,
            'Randevu Saati Güncellendi',
            'Randevu Saati Güncellendi',
            [
              `<strong>${client?.full_name || 'Müvekkil'}</strong> ile olan randevu saatinizi güncellediniz.`,
              `<strong>Konu:</strong> ${updated.topic}`,
              `<strong>Yeni Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${updated.duration_minutes} dakika`,
              updated.notes ? `<strong>Notlar:</strong> ${updated.notes}` : '',
            ].filter(Boolean)
          );
        }
      } catch (e: any) {
        console.error('Lawyer email error:', e.message);
      }
    }

    // Create notifications for both parties
    const notifications = [];
    if (current.client_id) {
      notifications.push({
        user_id: current.client_id,
        type: 'appointment',
        title: 'Randevu saati değişti',
        message: `${lawyer?.full_name || 'Avukat'} randevu saatini güncelledi: ${updated.topic}`,
        related_id: updated.id,
      });
    }
    if (current.lawyer_id) {
      notifications.push({
        user_id: current.lawyer_id,
        type: 'appointment',
        title: 'Randevu saati güncellendi',
        message: `${client?.full_name || 'Müvekkil'} ile randevu saati güncellendi: ${updated.topic}`,
        related_id: updated.id,
      });
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Update appointment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
