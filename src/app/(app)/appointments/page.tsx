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

  const [{ data: appointments }] = await Promise.all([
    query.order('appointment_date', { ascending: true }),
  ]);

  // Fetch connected lawyers for client, or clients for lawyer
  let lawyers: any[] = [];
  let clients: any[] = [];
  let hearingDosyaIds: string[] = [];

  if (role === 'lawyer') {
    const { data: lawyerLinks } = await supabase.from('dosya_lawyers').select('dosya_id').eq('lawyer_id', user.id);
    hearingDosyaIds = (lawyerLinks ?? []).map((l) => l.dosya_id);
    if (hearingDosyaIds.length > 0) {
      const { data: clientLinks } = await supabase.from('dosya_clients').select('client_id').in('dosya_id', hearingDosyaIds);
      const clientIds = [...new Set((clientLinks ?? []).map((c) => c.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase.from('profiles').select('id, full_name').in('id', clientIds);
        clients = clientProfiles ?? [];
      }
    }
  } else if (role === 'client') {
    const { data: clientLinks } = await supabase.from('dosya_clients').select('dosya_id').eq('client_id', user.id);
    hearingDosyaIds = (clientLinks ?? []).map((c) => c.dosya_id);
    if (hearingDosyaIds.length > 0) {
      const { data: lawyerLinks } = await supabase.from('dosya_lawyers').select('lawyer_id').in('dosya_id', hearingDosyaIds);
      const lawyerIds = [...new Set((lawyerLinks ?? []).map((l) => l.lawyer_id).filter(Boolean))];
      if (lawyerIds.length > 0) {
        const { data: lawyerProfiles } = await supabase.from('profiles').select('id, full_name, specialization').in('id', lawyerIds).eq('role', 'lawyer');
        lawyers = lawyerProfiles ?? [];
      }
    }
  }

  let hearings: any[] = [];
  if (hearingDosyaIds.length > 0) {
    const { data: h } = await supabase
      .from('hearings')
      .select('*, dosya:dosya_id(title, lawyers:dosya_lawyers(lawyer:lawyer_id(id, full_name)), clients:dosya_clients(client:client_id(id, full_name)))')
      .in('dosya_id', hearingDosyaIds)
      .order('hearing_date', { ascending: true });
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
