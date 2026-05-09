import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const role = profile?.role ?? 'client';

  let dosyalar: any[] = [];
  let appointments: any[] = [];
  let hearings: any[] = [];
  let unreadMessages = 0;
  let totalUsers = 0;
  let totalDosyalar = 0;
  let categories: any[] = [];
  let statuses: any[] = [];

  if (role === 'lawyer' || role === 'client') {
    // Find dosya IDs the user is connected to
    let dosyaIds: string[] = [];
    if (role === 'lawyer') {
      const { data } = await supabase.from('dosya_lawyers').select('dosya_id').eq('lawyer_id', user.id);
      dosyaIds = (data ?? []).map((d) => d.dosya_id);
    } else {
      const { data } = await supabase.from('dosya_clients').select('dosya_id').eq('client_id', user.id);
      dosyaIds = (data ?? []).map((d) => d.dosya_id);
    }

    const dosyalarPromise = dosyaIds.length > 0
      ? supabase
          .from('dosyalar')
          .select('*, lawyers:dosya_lawyers(lawyer:lawyer_id(id, full_name)), clients:dosya_clients(client:client_id(id, full_name)), category:category_id(name,color), status:status_id(name,color)')
          .in('id', dosyaIds)
          .order('updated_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] });

    const apptQuery = role === 'lawyer'
      ? supabase.from('appointments').select('*').eq('lawyer_id', user.id).gte('appointment_date', new Date().toISOString()).order('appointment_date', { ascending: true }).limit(5)
      : supabase.from('appointments').select('*').eq('client_id', user.id).gte('appointment_date', new Date().toISOString()).order('appointment_date', { ascending: true }).limit(5);

    const [{ data: d }, { data: a }, { count: um }, { data: cat }, { data: st }] = await Promise.all([
      dosyalarPromise,
      apptQuery,
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
      role === 'lawyer'
        ? supabase.from('categories').select('*').or(`is_system.eq.true,created_by.eq.${user.id}`)
        : supabase.from('categories').select('*'),
      role === 'lawyer'
        ? supabase.from('statuses').select('*').or(`is_system.eq.true,created_by.eq.${user.id}`).order('order', { ascending: true })
        : supabase.from('statuses').select('*').order('order', { ascending: true }),
    ]);
    dosyalar = d ?? [];
    appointments = a ?? [];
    unreadMessages = um ?? 0;
    categories = cat ?? [];
    statuses = st ?? [];

    if (dosyaIds.length > 0) {
      const { data: h } = await supabase
        .from('hearings')
        .select('*, dosya:dosya_id(title)')
        .in('dosya_id', dosyaIds)
        .gte('hearing_date', new Date().toISOString())
        .order('hearing_date', { ascending: true })
        .limit(5);
      hearings = h ?? [];
    }
  } else if (role === 'admin') {
    const [{ count: tu }, { count: td }, { data: d }, { data: cat }, { data: st }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('dosyalar').select('*', { count: 'exact', head: true }),
      supabase.from('dosyalar').select('*, lawyers:dosya_lawyers(lawyer:lawyer_id(id, full_name)), clients:dosya_clients(client:client_id(id, full_name)), category:category_id(name,color), status:status_id(name,color)').order('updated_at', { ascending: false }).limit(5),
      supabase.from('categories').select('*'),
      supabase.from('statuses').select('*').order('order', { ascending: true }),
    ]);
    totalUsers = tu ?? 0;
    totalDosyalar = td ?? 0;
    dosyalar = d ?? [];
    categories = cat ?? [];
    statuses = st ?? [];
  }

  return (
    <DashboardClient
      role={role}
      profile={profile}
      dosyalar={dosyalar}
      appointments={appointments}
      hearings={hearings}
      unreadMessages={unreadMessages}
      totalUsers={totalUsers}
      totalDosyalar={totalDosyalar}
      categories={categories}
      statuses={statuses}
    />
  );
}
