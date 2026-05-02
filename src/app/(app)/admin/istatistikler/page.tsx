import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsClient from './StatsClient'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: analyses } = await supabase
    .from('analyses')
    .select('status, created_at, analysis_results(mite_count, confidence_score)')

  const { data: patients } = await supabase
    .from('patients')
    .select('age, gender')

  const completedAnalyses = analyses?.filter((a) => a.status === 'COMPLETED') ?? []
  const totalMiteCount = completedAnalyses.reduce((sum, a) => sum + (a.analysis_results?.[0]?.mite_count ?? 0), 0)
  const avgMiteCount = completedAnalyses.length > 0 ? totalMiteCount / completedAnalyses.length : 0
  const avgConfidence = completedAnalyses.length > 0
    ? completedAnalyses.reduce((sum, a) => sum + (a.analysis_results?.[0]?.confidence_score ?? 0), 0) / completedAnalyses.length
    : 0

  const ageGroups = { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '60+': 0 }
  patients?.forEach((p) => {
    const age = p.age ?? 0
    if (age <= 30) ageGroups['20-30']++
    else if (age <= 40) ageGroups['31-40']++
    else if (age <= 50) ageGroups['41-50']++
    else if (age <= 60) ageGroups['51-60']++
    else ageGroups['60+']++
  })

  const genderDist = { Kadın: 0, Erkek: 0, Belirtilmemiş: 0 }
  patients?.forEach((p) => {
    if (p.gender === 'Kadın') genderDist.Kadın++
    else if (p.gender === 'Erkek') genderDist.Erkek++
    else genderDist.Belirtilmemiş++
  })

  return (
    <StatsClient
      totalAnalyses={analyses?.length ?? 0}
      completedCount={completedAnalyses.length}
      avgMiteCount={avgMiteCount}
      avgConfidence={avgConfidence}
      ageGroups={ageGroups}
      genderDist={genderDist}
    />
  )
}
