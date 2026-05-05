import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DosyalarClient from './DosyalarClient';

export default async function DosyalarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let query = supabase.from('dosyalar').select('*, lawyer:lawyer_id(full_name), client:client_id(full_name), category:category_id(name,color), status:status_id(name,color)');
  if (role === 'lawyer') query = query.eq('lawyer_id', user.id);
  else if (role === 'client') query = query.eq('client_id', user.id);

  const [{ data: dosyalar }, { data: categories }, { data: statuses }, { data: clients }] = await Promise.all([
    query.order('updated_at', { ascending: false }),
    supabase.from('categories').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`),
    supabase.from('statuses').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`).order('order', { ascending: true }),
    role === 'lawyer' ? supabase.from('profiles').select('id, full_name').eq('role', 'client') : Promise.resolve({ data: [] }),
  ]);

  return <DosyalarClient dosyalar={dosyalar ?? []} role={role} userId={user.id} categories={categories ?? []} statuses={statuses ?? []} clients={clients ?? []} />;
}
