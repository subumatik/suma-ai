import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClient from './ClientsClient';

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, referans_kodu').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let clients: any[] = [];

  if (role === 'lawyer') {
    // Find dosyalar where this user is a lawyer
    const { data: lawyerLinks } = await supabase
      .from('dosya_lawyers')
      .select('dosya_id')
      .eq('lawyer_id', user.id);
    const dosyaIds = (lawyerLinks ?? []).map((l) => l.dosya_id);

    if (dosyaIds.length > 0) {
      const { data: clientLinks } = await supabase
        .from('dosya_clients')
        .select('client_id')
        .in('dosya_id', dosyaIds);
      const clientIds = Array.from(new Set((clientLinks ?? []).map((c) => c.client_id)));

      if (clientIds.length > 0) {
        const { data: c } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', clientIds)
          .eq('role', 'client');
        clients = c ?? [];
      }
    }
  } else if (role === 'client') {
    const { data: c } = await supabase.from('profiles').select('id, full_name, email, phone').eq('id', user.id);
    clients = c ?? [];
  }

  return <ClientsClient clients={clients} role={role} referansKodu={profile?.referans_kodu ?? null} />;
}
