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
    .select('*, lawyer:lawyer_id(full_name), client:client_id(full_name), category:category_id(name,color), status:status_id(name,color)')
    .eq('id', id)
    .single();

  if (!dosya) notFound();

  const [{ data: documents }, { data: statusUpdates }, { data: messages }, { data: statuses }, { data: categories }] = await Promise.all([
    supabase.from('dosya_documents').select('*, uploader:uploaded_by(full_name)').eq('dosya_id', id).order('created_at', { ascending: false }),
    supabase.from('dosya_status_updates').select('*, updater:updated_by(full_name), status:status_id(name,color)').eq('dosya_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*, sender:sender_id(full_name)').eq('dosya_id', id).order('created_at', { ascending: true }),
    supabase.from('statuses').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`).order('order', { ascending: true }),
    supabase.from('categories').select('*').or(`is_system.eq.true${role === 'lawyer' ? `,created_by.eq.${user.id}` : ''}`),
  ]);

  return (
    <CaseDetailClient
      dosya={dosya}
      documents={documents ?? []}
      statusUpdates={statusUpdates ?? []}
      messages={messages ?? []}
      statuses={statuses ?? []}
      categories={categories ?? []}
      role={role}
      userId={user.id}
      userName={userName}
    />
  );
}
