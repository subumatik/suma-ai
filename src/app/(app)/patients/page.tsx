import { createClient } from '@/lib/supabase/server';
import PatientsClient from './PatientsClient';

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Patients fetch error:', error);
  }

  return <PatientsClient patients={patients ?? []} />;
}
