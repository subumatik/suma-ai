import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'client';
  if (role === 'client') redirect('/dashboard');

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${user.id}`)
    .order('name', { ascending: true });

  return <CategoriesClient categories={categories ?? []} userId={user.id} />;
}
