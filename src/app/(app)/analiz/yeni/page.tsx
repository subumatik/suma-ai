import { createClient } from '@/lib/supabase/server';
import NewAnalysisClient from './NewAnalysisClient';

export default async function NewAnalysisPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from('patients')
    .select('id, anonymous_hash, age, gender')
    .order('created_at', { ascending: false });

  return <NewAnalysisClient patients={patients ?? []} />;
}
