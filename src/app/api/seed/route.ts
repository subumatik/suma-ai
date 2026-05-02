import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { seedDummyData } from '@/lib/seed'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const stats = await seedDummyData(user.id)

    return NextResponse.json({ success: true, stats })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Seed failed' },
      { status: 500 }
    )
  }
}
