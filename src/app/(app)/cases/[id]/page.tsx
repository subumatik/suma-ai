import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import CaseDetailClient from './CaseDetailClient';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role ?? 'client';
  const userName = profile?.full_name ?? 'Kullanıcı';

  const { data: dosya } = await supabase
    .from('dosyalar')
    .select('*, lawyers:dosya_lawyers(lawyer:lawyer_id(id, full_name, email)), clients:dosya_clients(client:client_id(id, full_name, email)), category:category_id(name,color), status:status_id(name,color)')
    .eq('id', id)
    .single();

  if (!dosya) notFound();

  // Fetch lawyer's own clients (clients connected via shared dosyalar)
  let myClients: any[] = [];
  if (role === 'lawyer') {
    const { data: myDosyaIds } = await supabase.from('dosya_lawyers').select('dosya_id').eq('lawyer_id', user.id);
    const dosyaIds = (myDosyaIds ?? []).map((d) => d.dosya_id);
    if (dosyaIds.length > 0) {
      const { data: myClientLinks } = await supabase.from('dosya_clients').select('client_id').in('dosya_id', dosyaIds);
      const clientIds = [...new Set((myClientLinks ?? []).map((c) => c.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase.from('profiles').select('id, full_name').in('id', clientIds).eq('role', 'client');
        myClients = clientProfiles ?? [];
      }
    }
  }

  const [{ data: documents }, { data: statusUpdates }, { data: messages }, { data: statuses }, { data: categories }, { data: hearings }, { data: appointments }, { data: allLawyers }] = await Promise.all([
    supabase.from('dosya_documents').select('*, uploader:uploaded_by(full_name)').eq('dosya_id', id).order('created_at', { ascending: false }),
    supabase.from('dosya_status_updates').select('*, updater:updated_by(full_name), status:status_id(name,color)').eq('dosya_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*, sender:sender_id(full_name)').eq('dosya_id', id).order('created_at', { ascending: true }),
    supabase.from('statuses').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`).order('order', { ascending: true }),
    supabase.from('categories').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`),
    supabase.from('hearings').select('*').eq('dosya_id', id).order('hearing_date', { ascending: true }),
    supabase.from('appointments').select('*, lawyer:lawyer_id(full_name), client:client_id(full_name)').eq('dosya_id', id).order('appointment_date', { ascending: true }),
    role === 'lawyer' || role === 'admin' ? supabase.from('profiles').select('id, full_name, specialization').eq('role', 'lawyer') : Promise.resolve({ data: [] }),
  ]);

  return (
    <CaseDetailClient
      dosya={dosya}
      documents={documents ?? []}
      statusUpdates={statusUpdates ?? []}
      messages={messages ?? []}
      statuses={statuses ?? []}
      categories={categories ?? []}
      hearings={hearings ?? []}
      appointments={appointments ?? []}
      allClients={myClients}
      allLawyers={allLawyers ?? []}
      role={role}
      userId={user.id}
      userName={userName}
    />
  );
}
