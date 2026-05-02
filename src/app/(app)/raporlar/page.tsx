import { createClient } from '@/lib/supabase/server';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select('*, analyses(patient_id, patients(anonymous_hash)), analysis_results(mite_count, mite_density, confidence_score)')
    .order('created_at', { ascending: false });

  return <ReportsClient reports={reports ?? []} />;
}
