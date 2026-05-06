import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: requester } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (requester?.role !== 'client') {
      return NextResponse.json({ error: 'Sadece müvekkiller avukat ekleyebilir' }, { status: 403 });
    }

    const body = await req.json();
    const { code } = body;
    if (!code) return NextResponse.json({ error: 'Referans kodu gerekli' }, { status: 400 });

    const { data: lawyer } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('referans_kodu', code.toUpperCase())
      .eq('role', 'lawyer')
      .maybeSingle();

    if (!lawyer) {
      return NextResponse.json({ error: 'Geçersiz referans kodu' }, { status: 404 });
    }

    // Check if already connected via any dosya
    const { data: existing } = await supabase
      .from('dosyalar')
      .select('id')
      .eq('lawyer_id', lawyer.id)
      .eq('client_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Bu avukat zaten bağlı' }, { status: 400 });
    }

    // Create a minimal dosya to establish the connection
    const { data: dosya, error: insertError } = await supabase
      .from('dosyalar')
      .insert({
        title: 'Genel Danışmanlık',
        lawyer_id: lawyer.id,
        client_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lawyer, dosya });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bir hata oluştu' }, { status: 500 });
  }
}
