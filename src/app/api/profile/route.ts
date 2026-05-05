import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 });
    }

    const body = await request.json();
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    const specialization = typeof body.specialization === 'string' && body.specialization.trim()
      ? body.specialization.trim()
      : null;
    const baroNumber = typeof body.baro_number === 'string' && body.baro_number.trim()
      ? body.baro_number.trim()
      : null;

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Ad soyad ve e-posta zorunludur' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const patch: Record<string, string | null> = {
      full_name: fullName,
      email,
      phone,
    };

    if (profile?.role === 'lawyer') {
      patch.specialization = specialization;
      patch.baro_number = baroNumber;
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Profil guncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile route error:', error);
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 });
  }
}
