import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalCases } = await supabase.from('cases').select('*', { count: 'exact', head: true });
  const { count: totalAppointments } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
  const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });

  const { data: usersByRole } = await supabase.from('profiles').select('role');
  const lawyerCount = usersByRole?.filter((u) => u.role === 'lawyer').length ?? 0;
  const clientCount = usersByRole?.filter((u) => u.role === 'client').length ?? 0;

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <AdminDashboardClient
      stats={{
        totalUsers: totalUsers ?? 0,
        totalCases: totalCases ?? 0,
        totalAppointments: totalAppointments ?? 0,
        totalMessages: totalMessages ?? 0,
        lawyerCount,
        clientCount,
      }}
      recentUsers={recentUsers ?? []}
    />
  );
}
