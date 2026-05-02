import { createClient } from '@/lib/supabase/server';
import { cachedFetch } from '@/lib/upstash/cache';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? 'anon';

  const dashboardData = await cachedFetch(
    `dashboard:${userId}`,
    async () => {
      const { count: totalAnalyses } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true });

      const { count: activePatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: thisMonthReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const { data: recentAnalyses } = await supabase
        .from('analyses')
        .select('*, patients(anonymous_hash), analysis_results(mite_count, confidence_score)')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        stats: {
          totalAnalyses: totalAnalyses ?? 0,
          activePatients: activePatients ?? 0,
          thisMonthReports: thisMonthReports ?? 0,
          successRate: 94.2,
        },
        recentAnalyses: recentAnalyses ?? [],
      };
    },
    { ttl: 60 }
  );

  return <DashboardClient stats={dashboardData.stats} recentAnalyses={dashboardData.recentAnalyses} />;
}
