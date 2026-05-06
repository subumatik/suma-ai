import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dosya_id, hearing_date, court_name, description, reminder_days_before } = await req.json();

    if (!dosya_id || !hearing_date) {
      return NextResponse.json({ error: 'Dosya ve duruşma tarihi zorunludur' }, { status: 400 });
    }

    // Verify user is the lawyer on this case
    const { data: dosya } = await supabase.from('dosyalar').select('lawyer_id, client_id, title').eq('id', dosya_id).single();
    if (!dosya) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 });
    if (dosya.lawyer_id !== user.id) {
      return NextResponse.json({ error: 'Bu dosyaya duruşma ekleme yetkiniz yok' }, { status: 403 });
    }

    const { data: hearing, error } = await supabase
      .from('hearings')
      .insert({ dosya_id, hearing_date, court_name: court_name || null, description: description || null, reminder_days_before: reminder_days_before ?? null })
      .select('*')
      .single();

    if (error) {
      console.error('Hearing insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, hearing });
  } catch (error: any) {
    console.error('Create hearing API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
