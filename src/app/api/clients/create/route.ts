import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'lawyer') {
      return NextResponse.json({ error: 'Sadece avukatlar müvekkil ekleyebilir' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, email, phone, password } = body

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Ad soyad, e-posta ve şifre zorunludur' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (newUser?.user) {
      await admin.from('profiles').insert({
        id: newUser.user.id,
        full_name,
        email,
        phone: phone || null,
        role: 'client',
      })

      // Otomatik dava oluştur
      await admin.from('cases').insert({
        title: 'Genel Hukuki Danışmanlık',
        description: `${full_name} için avukat tarafından oluşturulan dava kaydı.`,
        lawyer_id: user.id,
        client_id: newUser.user.id,
        status: 'ACTIVE',
      })
    }

    return NextResponse.json({ success: true, userId: newUser?.user?.id })
  } catch (error: any) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: error?.message ?? 'Müvekkil eklenemedi' }, { status: 500 })
  }
}
