import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesClient from './MessagesClient';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role ?? 'client';
  const userName = profile?.full_name ?? 'Kullanıcı';

  // Find dosyalar the user is on, then derive connected users
  let connectedUserIds: string[] = [];

  if (role === 'client') {
    const { data: clientLinks } = await supabase.from('dosya_clients').select('dosya_id').eq('client_id', user.id);
    const dosyaIds = (clientLinks ?? []).map((c) => c.dosya_id);
    if (dosyaIds.length > 0) {
      const { data: lawyerLinks } = await supabase.from('dosya_lawyers').select('lawyer_id').in('dosya_id', dosyaIds);
      connectedUserIds = [...new Set((lawyerLinks ?? []).map((l) => l.lawyer_id).filter(Boolean))];
    }
  } else if (role === 'lawyer') {
    const { data: lawyerLinks } = await supabase.from('dosya_lawyers').select('dosya_id').eq('lawyer_id', user.id);
    const dosyaIds = (lawyerLinks ?? []).map((l) => l.dosya_id);
    if (dosyaIds.length > 0) {
      // All clients on shared dosyalar
      const { data: clientLinks } = await supabase.from('dosya_clients').select('client_id').in('dosya_id', dosyaIds);
      const clientIds = (clientLinks ?? []).map((c) => c.client_id).filter(Boolean);
      // Other lawyers on shared dosyalar
      const { data: otherLawyerLinks } = await supabase.from('dosya_lawyers').select('lawyer_id').in('dosya_id', dosyaIds);
      const otherLawyerIds = (otherLawyerLinks ?? []).map((l) => l.lawyer_id).filter((id) => id !== user.id);
      connectedUserIds = [...new Set([...clientIds, ...otherLawyerIds])];
    }
  }

  // Fetch connected lawyers through lawyer_connections
  if (role === 'lawyer') {
    const { data: conns } = await supabase.from('lawyer_connections').select('lawyer_a_id, lawyer_b_id').or(`lawyer_a_id.eq.${user.id},lawyer_b_id.eq.${user.id}`);
    const lawyerConnIds = (conns ?? []).map((c) => (c.lawyer_a_id === user.id ? c.lawyer_b_id : c.lawyer_a_id));
    connectedUserIds = [...new Set([...connectedUserIds, ...lawyerConnIds])];
  }

  const [{ data: messages }, { data: connectedUsers }] = await Promise.all([
    supabase.from('messages').select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(200),
    connectedUserIds.length > 0
      ? supabase.from('profiles').select('id, full_name, role, specialization, baro_number, referans_kodu').in('id', connectedUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Contacts = people we have messages with
  const contactIds = Array.from(new Set([
    ...(messages?.filter((m) => m.sender_id === user.id).map((m) => m.receiver_id) ?? []),
    ...(messages?.filter((m) => m.receiver_id === user.id).map((m) => m.sender_id) ?? []),
  ]));

  const contacts = (connectedUsers ?? []).filter((u) => contactIds.includes(u.id));

  return (
    <MessagesClient
      userId={user.id}
      userName={userName}
      role={role}
      contacts={contacts}
      allUsers={connectedUsers ?? []}
      messages={messages ?? []}
    />
  );
}
