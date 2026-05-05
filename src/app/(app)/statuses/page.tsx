import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatusesClient from './StatusesClient';

export default async function StatusesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';
  if (role === 'client') redirect('/dashboard');

  const { data: statuses } = await supabase
    .from('statuses')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${user.id}`)
    .order('order', { ascending: true });

  return <StatusesClient statuses={statuses ?? []} userId={user.id} />;
}
