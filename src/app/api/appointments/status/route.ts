import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { appointment_id, status } = body;

    if (!appointment_id || !status) {
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

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({ status })
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

    const statusLabels: Record<string, string> = {
      CONFIRMED: 'Onaylandı',
      CANCELLED: 'İptal Edildi',
      COMPLETED: 'Tamamlandı',
    };

    const statusLabel = statusLabels[status] || status;

    // Send emails based on status change
    if (status === 'CONFIRMED') {
      try {
        if (client?.email) {
          await sendAppointmentEmail(
            client.email,
            'Randevunuz Onaylandı',
            'Randevunuz Onaylandı',
            [
              `<strong>${lawyer?.full_name || 'Avukat'}</strong> randevu talebinizi onayladı.`,
              `<strong>Konu:</strong> ${updated.topic}`,
              `<strong>Tarih:</strong> ${dateStr}`,
              `<strong>Süre:</strong> ${updated.duration_minutes} dakika`,
              `Randevu saatinde hazır bulunmayı unutmayın.`,
            ]
          );
        }
      } catch (e: any) {
        console.error('Client email error:', e.message);
      }
    } else if (status === 'CANCELLED') {
      try {
        if (client?.email) {
          await sendAppointmentEmail(
            client.email,
            'Randevunuz İptal Edildi',
            'Randevunuz İptal Edildi',
            [
              `<strong>${lawyer?.full_name || 'Avukat'}</strong> randevu talebinizi iptal etti.`,
              `<strong>Konu:</strong> ${updated.topic}`,
              `<strong>Tarih:</strong> ${dateStr}`,
              `Başka bir tarih için yeni randevu talebinde bulunabilirsiniz.`,
            ]
          );
        }
      } catch (e: any) {
        console.error('Client email error:', e.message);
      }
    }

    // Notifications
    const targetUserId = user.id === current.lawyer_id ? current.client_id : current.lawyer_id;
    const targetName = user.id === current.lawyer_id ? lawyer?.full_name : client?.full_name;
    const actorName = user.id === current.lawyer_id ? lawyer?.full_name : client?.full_name;

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'appointment',
      title: `Randevu ${statusLabel}`,
      message: `${actorName} randevuyu ${statusLabel.toLowerCase()}: ${updated.topic}`,
      related_id: updated.id,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Status appointment API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
