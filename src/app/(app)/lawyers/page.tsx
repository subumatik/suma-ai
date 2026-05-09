import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LawyersClient from './LawyersClient';

export default async function LawyersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, referans_kodu').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let lawyers: any[] = [];

  if (role === 'lawyer' || role === 'admin') {
    const { data: l } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, specialization, baro_number, referans_kodu')
      .eq('role', 'lawyer');
    lawyers = l ?? [];
  } else {
    // Client: find lawyers via shared dosyalar
    const { data: clientLinks } = await supabase
      .from('dosya_clients')
      .select('dosya_id')
      .eq('client_id', user.id);
    const dosyaIds = (clientLinks ?? []).map((c) => c.dosya_id);

    if (dosyaIds.length > 0) {
      const { data: lawyerLinks } = await supabase
        .from('dosya_lawyers')
        .select('lawyer_id')
        .in('dosya_id', dosyaIds);
      const lawyerIds = Array.from(new Set((lawyerLinks ?? []).map((l) => l.lawyer_id)));

      if (lawyerIds.length > 0) {
        const { data: l } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, specialization, baro_number, referans_kodu')
          .in('id', lawyerIds)
          .eq('role', 'lawyer');
        lawyers = l ?? [];
      }
    }
  }

  return <LawyersClient lawyers={lawyers} userId={user.id} role={role} />;
}
