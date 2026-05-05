import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MusterilerClient from './MusterilerClient';

export default async function MusterilerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let clients: any[] = [];

  if (role === 'lawyer') {
    // Avukat için: davalarındaki müvekkiller
    const { data: caseClients } = await supabase
      .from('cases')
      .select('client_id')
      .eq('lawyer_id', user.id);
    const clientIds = Array.from(new Set(caseClients?.map((c) => c.client_id) ?? []));

    if (clientIds.length > 0) {
      const { data: c } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', clientIds)
        .eq('role', 'client');
      clients = c ?? [];
    }
  } else if (role === 'client') {
    // Müvekkil için: davalarındaki diğer müvekkilleri gösterme, kendi profili
    const { data: c } = await supabase.from('profiles').select('id, full_name, email, phone').eq('id', user.id);
    clients = c ?? [];
  }

  return <MusterilerClient clients={clients} role={role} />;
}
