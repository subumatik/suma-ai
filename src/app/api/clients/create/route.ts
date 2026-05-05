import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'lawyer') {
      return NextResponse.json({ error: 'Sadece avukatlar muvekkil ekleyebilir' }, { status: 403 });
    }

    const body = await request.json();
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Ad soyad, e-posta ve sifre zorunludur' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Sifre en az 8 karakter olmalidir' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: defaultStatus, error: statusError } = await admin
      .from('statuses')
      .select('id')
      .or(`is_system.eq.true,created_by.eq.${user.id}`)
      .order('is_default', { ascending: false })
      .order('order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (statusError || !defaultStatus?.id) {
      return NextResponse.json({ error: 'Varsayilan dosya durumu bulunamadi' }, { status: 500 });
    }

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !newUser?.user) {
      return NextResponse.json({ error: createError?.message ?? 'Kullanici olusturulamadi' }, { status: 400 });
    }

    const { error: profileError } = await admin.from('profiles').upsert({
      id: newUser.user.id,
      full_name: fullName,
      email,
      phone,
      role: 'client',
      referans_kodu: null,
      email_verified: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: 'Profil olusturulamadi' }, { status: 500 });
    }

    const { error: dosyaError } = await admin.from('dosyalar').insert({
      title: 'Genel Hukuki Danismanlik',
      description: `${fullName} icin avukat tarafindan olusturulan dosya kaydi.`,
      lawyer_id: user.id,
      client_id: newUser.user.id,
      status_id: defaultStatus.id,
    });

    if (dosyaError) {
      await admin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: 'Dosya kaydi olusturulamadi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: error?.message ?? 'Muvekkil eklenemedi' }, { status: 500 });
  }
}
