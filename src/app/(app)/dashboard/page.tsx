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
  let unreadMessages = 0;
  let totalUsers = 0;
  let totalDosyalar = 0;
  let categories: any[] = [];
  let statuses: any[] = [];

  if (role === 'lawyer') {
    const [{ data: d }, { data: a }, { count: um }, { data: cat }, { data: st }] = await Promise.all([
      supabase.from('dosyalar').select('*, client:client_id(full_name), category:category_id(name,color), status:status_id(name,color)').eq('lawyer_id', user.id).order('updated_at', { ascending: false }).limit(5),
      supabase.from('appointments').select('*').eq('lawyer_id', user.id).gte('appointment_date', new Date().toISOString()).order('appointment_date', { ascending: true }).limit(5),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
      supabase.from('categories').select('*').or(`is_system.eq.true,created_by.eq.${user.id}`),
      supabase.from('statuses').select('*').or(`is_system.eq.true,created_by.eq.${user.id}`).order('order', { ascending: true }),
    ]);
    dosyalar = d ?? [];
    appointments = a ?? [];
    unreadMessages = um ?? 0;
    categories = cat ?? [];
    statuses = st ?? [];
  } else if (role === 'client') {
    const [{ data: d }, { data: a }, { count: um }, { data: cat }, { data: st }] = await Promise.all([
      supabase.from('dosyalar').select('*, lawyer:lawyer_id(full_name), category:category_id(name,color), status:status_id(name,color)').eq('client_id', user.id).order('updated_at', { ascending: false }).limit(5),
      supabase.from('appointments').select('*').eq('client_id', user.id).gte('appointment_date', new Date().toISOString()).order('appointment_date', { ascending: true }).limit(5),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
      supabase.from('categories').select('*'),
      supabase.from('statuses').select('*').order('order', { ascending: true }),
    ]);
    dosyalar = d ?? [];
    appointments = a ?? [];
    unreadMessages = um ?? 0;
    categories = cat ?? [];
    statuses = st ?? [];
  } else if (role === 'admin') {
    const [{ count: tu }, { count: td }, { data: d }, { data: cat }, { data: st }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('dosyalar').select('*', { count: 'exact', head: true }),
      supabase.from('dosyalar').select('*, client:client_id(full_name), category:category_id(name,color), status:status_id(name,color)').order('updated_at', { ascending: false }).limit(5),
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
      unreadMessages={unreadMessages}
      totalUsers={totalUsers}
      totalDosyalar={totalDosyalar}
      categories={categories}
      statuses={statuses}
    />
  );
}
