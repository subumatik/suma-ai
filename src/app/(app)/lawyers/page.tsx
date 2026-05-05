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

  if (role === 'client') {
    const { data: caseLawyers } = await supabase
      .from('dosyalar')
      .select('lawyer_id')
      .eq('client_id', user.id);
    const lawyerIds = Array.from(new Set(caseLawyers?.map((c) => c.lawyer_id) ?? []));

    if (lawyerIds.length > 0) {
      const { data: l } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, specialization, baro_number, referans_kodu')
        .in('id', lawyerIds)
        .eq('role', 'lawyer');
      lawyers = l ?? [];
    }
  } else {
    const { data: l } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, specialization, baro_number, referans_kodu')
      .eq('role', 'lawyer');
    lawyers = l ?? [];
  }

  return <LawyersClient lawyers={lawyers} userId={user.id} />;
}
