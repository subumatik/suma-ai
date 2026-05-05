import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = createAdminClient()

    // 1. Örnek Avukat
    const { data: avukatUser, error: avukatError } = await supabase.auth.admin.createUser({
      email: 'ornekavukat@avukatip.com',
      password: 'Sifre123!',
      email_confirm: true,
      user_metadata: { full_name: 'Örnek Avukat' },
    })

    if (avukatError && !avukatError.message.includes('already been registered')) {
      throw avukatError
    }

    if (avukatUser?.user) {
      await supabase.from('profiles').upsert({
        id: avukatUser.user.id,
        full_name: 'Örnek Avukat',
        email: 'ornekavukat@avukatip.com',
        phone: '0532 123 45 67',
        role: 'lawyer',
        baro_number: '12345',
        specialization: 'Ceza Hukuku',
        referans_kodu: 'AVK001',
      })
    }

    // 2. Örnek Müvekkil
    const { data: muvekkilUser, error: muvekkilError } = await supabase.auth.admin.createUser({
      email: 'ornekmuvekkil@avukatip.com',
      password: 'Sifre123!',
      email_confirm: true,
      user_metadata: { full_name: 'Örnek Müvekkil' },
    })

    if (muvekkilError && !muvekkilError.message.includes('already been registered')) {
      throw muvekkilError
    }

    if (muvekkilUser?.user) {
      await supabase.from('profiles').upsert({
        id: muvekkilUser.user.id,
        full_name: 'Örnek Müvekkil',
        email: 'ornekmuvekkil@avukatip.com',
        phone: '0533 987 65 43',
        role: 'client',
      })

      // Müvekkili avukata bağla (referans kodu ile)
      const { data: lawyers } = await supabase.from('profiles').select('id').eq('referans_kodu', 'AVK001').eq('role', 'lawyer')
      if (lawyers && lawyers.length > 0) {
        for (const lawyer of lawyers) {
          await supabase.from('cases').upsert({
            title: 'Genel Hukuki Danışmanlık',
            description: 'Örnek müvekkil tarafından referans kodu ile oluşturulan dava kaydı.',
            lawyer_id: lawyer.id,
            client_id: muvekkilUser.user.id,
            status: 'ACTIVE',
          }, { onConflict: 'id' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      avukat: avukatUser?.user?.email ?? 'ornekavukat@avukatip.com (zaten var)',
      muvekkil: muvekkilUser?.user?.email ?? 'ornekmuvekkil@avukatip.com (zaten var)',
      message: 'Örnek kullanıcılar oluşturuldu. Şifre: Sifre123!',
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error?.message ?? 'Seed failed' }, { status: 500 })
  }
}
