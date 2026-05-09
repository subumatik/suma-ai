import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = createAdminClient();

    const { data: avukatUser, error: avukatError } = await supabase.auth.admin.createUser({
      email: 'ornekavukat@avukatip.com',
      password: 'Sifre123!',
      email_confirm: true,
      user_metadata: { full_name: 'Ornek Avukat' },
    });

    if (avukatError && !avukatError.message.includes('already been registered')) {
      throw avukatError;
    }

    if (avukatUser?.user) {
      await supabase.from('profiles').upsert({
        id: avukatUser.user.id,
        full_name: 'Ornek Avukat',
        email: 'ornekavukat@avukatip.com',
        phone: '0532 123 45 67',
        role: 'lawyer',
        baro_number: '12345',
        specialization: 'Ceza Hukuku',
        referans_kodu: 'AVK001',
        email_verified: true,
      });
    }

    const { data: muvekkilUser, error: muvekkilError } = await supabase.auth.admin.createUser({
      email: 'ornekmuvekkil@avukatip.com',
      password: 'Sifre123!',
      email_confirm: true,
      user_metadata: { full_name: 'Ornek Muvekkil' },
    });

    if (muvekkilError && !muvekkilError.message.includes('already been registered')) {
      throw muvekkilError;
    }

    if (muvekkilUser?.user) {
      await supabase.from('profiles').upsert({
        id: muvekkilUser.user.id,
        full_name: 'Ornek Muvekkil',
        email: 'ornekmuvekkil@avukatip.com',
        phone: '0533 987 65 43',
        role: 'client',
        referans_kodu: null,
        email_verified: true,
      });

      const { data: status } = await supabase
        .from('statuses')
        .select('id')
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      const { data: lawyers } = await supabase
        .from('profiles')
        .select('id')
        .eq('referans_kodu', 'AVK001')
        .eq('role', 'lawyer');

      if (status?.id && lawyers?.length) {
        for (const lawyer of lawyers) {
          const { data: created } = await supabase.from('dosyalar').insert({
            title: 'Genel Hukuki Danismanlik',
            description: 'Ornek muvekkil tarafindan referans kodu ile olusturulan dosya kaydi.',
            status_id: status.id,
          }).select('id').single();
          if (created?.id) {
            await supabase.from('dosya_lawyers').insert({ dosya_id: created.id, lawyer_id: lawyer.id });
            await supabase.from('dosya_clients').insert({ dosya_id: created.id, client_id: muvekkilUser.user.id });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      avukat: avukatUser?.user?.email ?? 'ornekavukat@avukatip.com (zaten var)',
      muvekkil: muvekkilUser?.user?.email ?? 'ornekmuvekkil@avukatip.com (zaten var)',
      message: 'Ornek kullanicilar olusturuldu. Sifre: Sifre123!',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error?.message ?? 'Seed failed' }, { status: 500 });
  }
}
