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
    const { data: existingLink } = await supabase
      .from('dosya_lawyers')
      .select('dosya_id, dosya:dosya_id!inner(id)')
      .eq('lawyer_id', lawyer.id);

    const existingDosyaIds = (existingLink ?? []).map((l: any) => l.dosya_id);
    if (existingDosyaIds.length > 0) {
      const { data: alreadyConnected } = await supabase
        .from('dosya_clients')
        .select('dosya_id')
        .eq('client_id', user.id)
        .in('dosya_id', existingDosyaIds)
        .maybeSingle();
      if (alreadyConnected) {
        return NextResponse.json({ error: 'Bu avukat zaten bağlı' }, { status: 400 });
      }
    }

    // Get default status
    const { data: defaultStatus } = await supabase
      .from('statuses')
      .select('id')
      .or(`is_system.eq.true,created_by.eq.${lawyer.id}`)
      .order('is_default', { ascending: false })
      .order('order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!defaultStatus?.id) {
      return NextResponse.json({ error: 'Varsayılan dosya durumu bulunamadı' }, { status: 500 });
    }

    // Create a minimal dosya to establish the connection
    const { data: dosya, error: insertError } = await supabase
      .from('dosyalar')
      .insert({
        title: 'Genel Danışmanlık',
        status_id: defaultStatus.id,
      })
      .select()
      .single();

    if (insertError || !dosya) {
      return NextResponse.json({ error: insertError?.message ?? 'Dosya oluşturulamadı' }, { status: 500 });
    }

    const { error: lawyerLinkError } = await supabase.from('dosya_lawyers').insert({ dosya_id: dosya.id, lawyer_id: lawyer.id });
    const { error: clientLinkError } = await supabase.from('dosya_clients').insert({ dosya_id: dosya.id, client_id: user.id });
    if (lawyerLinkError || clientLinkError) {
      await supabase.from('dosyalar').delete().eq('id', dosya.id);
      return NextResponse.json({ error: 'Bağlantı kurulamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lawyer, dosya });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bir hata oluştu' }, { status: 500 });
  }
}
