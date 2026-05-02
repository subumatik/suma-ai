import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Stats
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true })
  const { count: totalAnalyses } = await supabase.from('analyses').select('*', { count: 'exact', head: true })
  const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true })

  const { data: recentAnalyses } = await supabase
    .from('analyses')
    .select('*, patients(anonymous_hash), analysis_results(mite_count, confidence_score)')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: categoryCounts } = await supabase
    .from('analysis_results')
    .select('mite_count')

  const demodexCount = categoryCounts?.filter((r) => (r.mite_count ?? 0) > 0).length ?? 0
  const healthyCount = categoryCounts?.filter((r) => r.mite_count === 0).length ?? 0

  return (
    <AdminDashboardClient
      stats={{
        totalUsers: totalUsers ?? 0,
        totalPatients: totalPatients ?? 0,
        totalAnalyses: totalAnalyses ?? 0,
        totalReports: totalReports ?? 0,
        demodexCount,
        healthyCount,
      }}
      recentAnalyses={recentAnalyses ?? []}
    />
  )
}
