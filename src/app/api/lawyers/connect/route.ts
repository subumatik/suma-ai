import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { referansKodu } = await req.json();
    if (!referansKodu || typeof referansKodu !== 'string') {
      return NextResponse.json({ error: 'Referans kodu gereklidir' }, { status: 400 });
    }

    const code = referansKodu.trim().toUpperCase();

    // Verify requester is a lawyer
    const { data: requester } = await supabase.from('profiles').select('id, role, referans_kodu').eq('id', user.id).single();
    if (!requester || requester.role !== 'lawyer') {
      return NextResponse.json({ error: 'Bu işlem sadece avukatlar içindir' }, { status: 403 });
    }

    if (requester.referans_kodu === code) {
      return NextResponse.json({ error: 'Kendi referans kodunuzu giremezsiniz' }, { status: 400 });
    }

    // Find target lawyer by reference code
    const { data: target } = await supabase.from('profiles').select('id, role').eq('referans_kodu', code).eq('role', 'lawyer').single();
    if (!target) {
      return NextResponse.json({ error: 'Bu referans koduyla eşleşen bir avukat bulunamadı' }, { status: 404 });
    }

    // Check if connection already exists (either direction)
    const { data: existing } = await supabase
      .from('lawyer_connections')
      .select('id')
      .or(`and(lawyer_a_id.eq.${user.id},lawyer_b_id.eq.${target.id}),and(lawyer_a_id.eq.${target.id},lawyer_b_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Bu avukat ile zaten bağlantınız bulunmaktadır' }, { status: 409 });
    }

    // Create bidirectional connections
    const { error: insertError } = await supabase.from('lawyer_connections').insert([
      { lawyer_a_id: user.id, lawyer_b_id: target.id },
      { lawyer_a_id: target.id, lawyer_b_id: user.id },
    ]);

    if (insertError) {
      console.error('Lawyer connection insert error:', insertError);
      return NextResponse.json({ error: 'Bağlantı oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lawyerId: target.id });
  } catch (error: any) {
    console.error('Connect lawyer API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
