import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ClientDetailClient from './ClientDetailClient';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  const { data: client } = await supabase.from('profiles').select('*').eq('id', id).eq('role', 'client').single();
  if (!client) notFound();

  // Find shared dosyalar between current user (lawyer) and the client
  const { data: lawyerLinks } = await supabase
    .from('dosya_lawyers')
    .select('dosya_id')
    .eq('lawyer_id', user.id);
  const userDosyaIds = (lawyerLinks ?? []).map((l) => l.dosya_id);

  let dosyalar: any[] = [];
  if (userDosyaIds.length > 0) {
    const { data: clientLinks } = await supabase
      .from('dosya_clients')
      .select('dosya_id')
      .eq('client_id', id)
      .in('dosya_id', userDosyaIds);
    const sharedDosyaIds = (clientLinks ?? []).map((c) => c.dosya_id);

    if (sharedDosyaIds.length > 0) {
      const { data: d } = await supabase
        .from('dosyalar')
        .select('*, category:category_id(name,color), status:status_id(name,color)')
        .in('id', sharedDosyaIds)
        .order('updated_at', { ascending: false });
      dosyalar = d ?? [];
    }
  }

  const { data: statuses } = await supabase
    .from('statuses')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${user.id}`)
    .order('order', { ascending: true });

  return <ClientDetailClient client={client} dosyalar={dosyalar} statuses={statuses ?? []} role={role} userId={user.id} />;
}
