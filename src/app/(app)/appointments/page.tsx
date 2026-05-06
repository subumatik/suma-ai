import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppointmentsClient from './AppointmentsClient';

export default async function AppointmentsPage() {
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

  // Fetch unique clients for lawyer
  let clients: any[] = [];
  let hearingDosyaIds: string[] = [];
  if (role === 'lawyer') {
    const { data: dosyalar } = await supabase.from('dosyalar').select('client_id,id').eq('lawyer_id', user.id);
    const clientIds = [...new Set((dosyalar ?? []).map((d) => d.client_id).filter(Boolean))];
    hearingDosyaIds = (dosyalar ?? []).map((d) => d.id);
    if (clientIds.length > 0) {
      const { data: clientProfiles } = await supabase.from('profiles').select('id, full_name').in('id', clientIds);
      clients = clientProfiles ?? [];
    }
  } else if (role === 'client') {
    const { data: dosyalar } = await supabase.from('dosyalar').select('id').eq('client_id', user.id);
    hearingDosyaIds = (dosyalar ?? []).map((d) => d.id);
  }

  let hearings: any[] = [];
  if (hearingDosyaIds.length > 0) {
    const { data: h } = await supabase.from('hearings').select('*, dosya:dosya_id(title, lawyer_id, client_id)').in('dosya_id', hearingDosyaIds).order('hearing_date', { ascending: true });
    hearings = h ?? [];
  }

  return (
    <AppointmentsClient
      appointments={appointments ?? []}
      role={role}
      userId={user.id}
      lawyers={lawyers ?? []}
      clients={clients}
      hearings={hearings}
    />
  );
}
