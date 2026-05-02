import { createClient } from '@/lib/supabase/server';
import { cachedFetch } from '@/lib/upstash/cache';
import PatientsClient from './PatientsClient';

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? 'anon';

  const patients = await cachedFetch(
    `patients:${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Patients fetch error:', error);
      }
      return data ?? [];
    },
    { ttl: 30 }
  );

  return <PatientsClient patients={patients} userId={userId} />;
}
