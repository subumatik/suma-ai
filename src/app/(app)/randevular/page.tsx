import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RandevularClient from './RandevularClient';

export default async function RandevularPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let query = supabase.from('appointments').select('*, lawyer:lawyer_id(full_name), client:client_id(full_name)');
  if (role === 'lawyer') query = query.eq('lawyer_id', user.id);
  else if (role === 'client') query = query.eq('client_id', user.id);

  const [{ data: appointments }, { data: lawyers }] = await Promise.all([
    query.order('appointment_date', { ascending: true }),
    role === 'client' ? supabase.from('profiles').select('id, full_name, specialization').eq('role', 'lawyer') : Promise.resolve({ data: [] }),
  ]);

  return <RandevularClient appointments={appointments ?? []} role={role} userId={user.id} lawyers={lawyers ?? []} />;
}
