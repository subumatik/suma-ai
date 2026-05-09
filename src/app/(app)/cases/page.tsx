import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CasesClient from './CasesClient';

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  // Get dosya IDs the user is connected to
  let dosyaIds: string[] = [];
  if (role === 'lawyer') {
    const { data } = await supabase.from('dosya_lawyers').select('dosya_id').eq('lawyer_id', user.id);
    dosyaIds = (data ?? []).map((d) => d.dosya_id);
  } else if (role === 'client') {
    const { data } = await supabase.from('dosya_clients').select('dosya_id').eq('client_id', user.id);
    dosyaIds = (data ?? []).map((d) => d.dosya_id);
  }

  let dosyalarQuery = supabase
    .from('dosyalar')
    .select('*, lawyers:dosya_lawyers(lawyer:lawyer_id(id, full_name)), clients:dosya_clients(client:client_id(id, full_name)), category:category_id(name,color), status:status_id(name,color)');

  if (role !== 'admin') {
    if (dosyaIds.length === 0) {
      // No connected cases
      const [{ data: categories }, { data: statuses }, { data: clients }, { data: lawyersAll }] = await Promise.all([
        supabase.from('categories').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`),
        supabase.from('statuses').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`).order('order', { ascending: true }),
        role === 'lawyer' ? supabase.from('profiles').select('id, full_name').eq('role', 'client') : Promise.resolve({ data: [] }),
        role === 'lawyer' ? supabase.from('profiles').select('id, full_name, specialization').eq('role', 'lawyer') : Promise.resolve({ data: [] }),
      ]);
      return <CasesClient dosyalar={[]} role={role} userId={user.id} categories={categories ?? []} statuses={statuses ?? []} clients={clients ?? []} lawyersAll={lawyersAll ?? []} />;
    }
    dosyalarQuery = dosyalarQuery.in('id', dosyaIds);
  }

  const [{ data: dosyalar }, { data: categories }, { data: statuses }, { data: clients }, { data: lawyersAll }] = await Promise.all([
    dosyalarQuery.order('updated_at', { ascending: false }),
    supabase.from('categories').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`),
    supabase.from('statuses').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`).order('order', { ascending: true }),
    role === 'lawyer' || role === 'admin' ? supabase.from('profiles').select('id, full_name').eq('role', 'client') : Promise.resolve({ data: [] }),
    role === 'lawyer' || role === 'admin' ? supabase.from('profiles').select('id, full_name, specialization').eq('role', 'lawyer') : Promise.resolve({ data: [] }),
  ]);

  return <CasesClient dosyalar={dosyalar ?? []} role={role} userId={user.id} categories={categories ?? []} statuses={statuses ?? []} clients={clients ?? []} lawyersAll={lawyersAll ?? []} />;
}
