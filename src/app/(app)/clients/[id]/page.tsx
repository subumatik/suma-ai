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

  const [{ data: dosyalar }, { data: statuses }] = await Promise.all([
    supabase.from('dosyalar').select('*, category:category_id(name,color), status:status_id(name,color)').eq('client_id', id).eq('lawyer_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('statuses').select('*').or(`is_system.eq.true,created_by.eq.${user.id}`).order('order', { ascending: true }),
  ]);

  return <ClientDetailClient client={client} dosyalar={dosyalar ?? []} statuses={statuses ?? []} role={role} userId={user.id} />;
}
