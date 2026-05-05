import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MesajlarClient from './MesajlarClient';

export default async function MesajlarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  const [{ data: sent }, { data: received }, { data: messages }, { data: allUsers }] = await Promise.all([
    supabase.from('messages').select('receiver_id').eq('sender_id', user.id),
    supabase.from('messages').select('sender_id').eq('receiver_id', user.id),
    supabase.from('messages').select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(200),
    supabase.from('profiles').select('id, full_name, role, specialization, baro_number').neq('role', 'admin'),
  ]);

  const contactIds = Array.from(new Set([
    ...(sent?.map((s) => s.receiver_id) ?? []),
    ...(received?.map((r) => r.sender_id) ?? []),
  ]));

  const contacts = allUsers?.filter((u) => contactIds.includes(u.id)) ?? [];
  const relevantUsers = role === 'lawyer'
    ? allUsers?.filter((u) => u.role === 'client') ?? []
    : allUsers?.filter((u) => u.role === 'lawyer') ?? [];

  return (
    <MesajlarClient
      userId={user.id}
      role={role}
      contacts={contacts}
      allUsers={relevantUsers}
      messages={messages ?? []}
    />
  );
}
