import { createClient } from '@/lib/supabase/server';
import { cachedFetch } from '@/lib/upstash/cache';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? 'anon';

  const reports = await cachedFetch(
    `reports:${userId}`,
    async () => {
      const { data } = await supabase
        .from('reports')
        .select('*, analyses(patient_id, patients(anonymous_hash)), analysis_results(mite_count, mite_density, confidence_score)')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    { ttl: 60 }
  );

  return <ReportsClient reports={reports} />;
}
