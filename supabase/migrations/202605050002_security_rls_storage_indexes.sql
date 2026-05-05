-- Security hardening for RLS, storage, functions, and FK performance.

create schema if not exists app_private;
create schema if not exists extensions;

create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.current_user_role() = 'admin', false)
$$;

create or replace function app_private.has_dosya_access(p_dosya_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_admin(), false)
    or exists (
      select 1
      from public.dosyalar d
      where d.id = p_dosya_id
        and (d.lawyer_id = auth.uid() or d.client_id = auth.uid())
    )
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_user_role() to authenticated;
grant execute on function app_private.is_admin() to authenticated;
grant execute on function app_private.has_dosya_access(uuid) to authenticated;

alter function public.update_updated_at_column() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop function if exists public.search_similar_cases(public.vector, text, integer);
alter extension vector set schema extensions;

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
where id = 'case-documents';

drop policy if exists "Allow authenticated reads" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow authenticated deletes" on storage.objects;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.statuses enable row level security;
alter table public.dosyalar enable row level security;
alter table public.dosya_documents enable row level security;
alter table public.dosya_status_updates enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'categories', 'statuses', 'dosyalar', 'dosya_documents',
        'dosya_status_updates', 'appointments', 'messages', 'notifications',
        'audit_logs'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy "profiles_select_authenticated"
on public.profiles for select to authenticated
using (true);

create policy "profiles_insert_self_or_admin"
on public.profiles for insert to authenticated
with check (id = auth.uid() or app_private.is_admin());

create policy "profiles_update_admin_only"
on public.profiles for update to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "profiles_delete_admin_only"
on public.profiles for delete to authenticated
using (app_private.is_admin());

create policy "categories_select_visible"
on public.categories for select to authenticated
using (is_system or created_by = auth.uid() or app_private.is_admin());

create policy "categories_insert_own_or_admin"
on public.categories for insert to authenticated
with check ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "categories_update_own_or_admin"
on public.categories for update to authenticated
using ((created_by = auth.uid() and not is_system) or app_private.is_admin())
with check ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "categories_delete_own_or_admin"
on public.categories for delete to authenticated
using ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "statuses_select_visible"
on public.statuses for select to authenticated
using (is_system or created_by = auth.uid() or app_private.is_admin());

create policy "statuses_insert_own_or_admin"
on public.statuses for insert to authenticated
with check ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "statuses_update_own_or_admin"
on public.statuses for update to authenticated
using ((created_by = auth.uid() and not is_system) or app_private.is_admin())
with check ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "statuses_delete_own_or_admin"
on public.statuses for delete to authenticated
using ((created_by = auth.uid() and not is_system) or app_private.is_admin());

create policy "dosyalar_select_participant_or_admin"
on public.dosyalar for select to authenticated
using (lawyer_id = auth.uid() or client_id = auth.uid() or app_private.is_admin());

create policy "dosyalar_insert_lawyer_or_admin"
on public.dosyalar for insert to authenticated
with check ((lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer') or app_private.is_admin());

create policy "dosyalar_update_lawyer_or_admin"
on public.dosyalar for update to authenticated
using ((lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer') or app_private.is_admin())
with check ((lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer') or app_private.is_admin());

create policy "dosyalar_delete_lawyer_or_admin"
on public.dosyalar for delete to authenticated
using ((lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer') or app_private.is_admin());

create policy "documents_select_case_access"
on public.dosya_documents for select to authenticated
using (app_private.has_dosya_access(dosya_id));

create policy "documents_insert_case_access"
on public.dosya_documents for insert to authenticated
with check (uploaded_by = auth.uid() and app_private.has_dosya_access(dosya_id));

create policy "documents_update_uploader_or_admin"
on public.dosya_documents for update to authenticated
using (uploaded_by = auth.uid() or app_private.is_admin())
with check (uploaded_by = auth.uid() or app_private.is_admin());

create policy "documents_delete_uploader_lawyer_or_admin"
on public.dosya_documents for delete to authenticated
using (
  uploaded_by = auth.uid()
  or app_private.is_admin()
  or exists (
    select 1 from public.dosyalar d
    where d.id = dosya_id and d.lawyer_id = auth.uid()
  )
);

create policy "status_updates_select_case_access"
on public.dosya_status_updates for select to authenticated
using (app_private.has_dosya_access(dosya_id));

create policy "status_updates_insert_lawyer_or_admin"
on public.dosya_status_updates for insert to authenticated
with check (
  updated_by = auth.uid()
  and (
    app_private.is_admin()
    or exists (
      select 1 from public.dosyalar d
      where d.id = dosya_id and d.lawyer_id = auth.uid()
    )
  )
);

create policy "status_updates_delete_admin_only"
on public.dosya_status_updates for delete to authenticated
using (app_private.is_admin());

create policy "appointments_select_participant_or_admin"
on public.appointments for select to authenticated
using (lawyer_id = auth.uid() or client_id = auth.uid() or app_private.is_admin());

create policy "appointments_insert_client_or_admin"
on public.appointments for insert to authenticated
with check (client_id = auth.uid() or app_private.is_admin());

create policy "appointments_update_participant_or_admin"
on public.appointments for update to authenticated
using (lawyer_id = auth.uid() or client_id = auth.uid() or app_private.is_admin())
with check (lawyer_id = auth.uid() or client_id = auth.uid() or app_private.is_admin());

create policy "appointments_delete_participant_or_admin"
on public.appointments for delete to authenticated
using (lawyer_id = auth.uid() or client_id = auth.uid() or app_private.is_admin());

create policy "messages_select_participant_case_or_admin"
on public.messages for select to authenticated
using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
  or app_private.is_admin()
  or (dosya_id is not null and app_private.has_dosya_access(dosya_id))
);

create policy "messages_insert_sender"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (dosya_id is null or app_private.has_dosya_access(dosya_id))
);

create policy "messages_update_receiver_or_admin"
on public.messages for update to authenticated
using (receiver_id = auth.uid() or app_private.is_admin())
with check (receiver_id = auth.uid() or app_private.is_admin());

create policy "messages_delete_sender_or_admin"
on public.messages for delete to authenticated
using (sender_id = auth.uid() or app_private.is_admin());

create policy "notifications_select_own_or_admin"
on public.notifications for select to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "notifications_insert_admin_only"
on public.notifications for insert to authenticated
with check (app_private.is_admin());

create policy "notifications_update_own_or_admin"
on public.notifications for update to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

create policy "notifications_delete_own_or_admin"
on public.notifications for delete to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "audit_logs_select_admin_only"
on public.audit_logs for select to authenticated
using (app_private.is_admin());

create policy "audit_logs_insert_admin_only"
on public.audit_logs for insert to authenticated
with check (app_private.is_admin());

create index if not exists idx_appointments_client_id on public.appointments(client_id);
create index if not exists idx_appointments_lawyer_id on public.appointments(lawyer_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_categories_created_by on public.categories(created_by);
create index if not exists idx_dosya_documents_dosya_id on public.dosya_documents(dosya_id);
create index if not exists idx_dosya_documents_uploaded_by on public.dosya_documents(uploaded_by);
create index if not exists idx_dosya_status_updates_dosya_id on public.dosya_status_updates(dosya_id);
create index if not exists idx_dosya_status_updates_status_id on public.dosya_status_updates(status_id);
create index if not exists idx_dosya_status_updates_updated_by on public.dosya_status_updates(updated_by);
create index if not exists idx_dosyalar_category_id on public.dosyalar(category_id);
create index if not exists idx_dosyalar_client_id on public.dosyalar(client_id);
create index if not exists idx_dosyalar_lawyer_id on public.dosyalar(lawyer_id);
create index if not exists idx_dosyalar_status_id on public.dosyalar(status_id);
create index if not exists idx_messages_dosya_id on public.messages(dosya_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_statuses_created_by on public.statuses(created_by);

alter table public.profiles validate constraint profiles_id_auth_users_fkey;
alter table public.dosyalar validate constraint dosyalar_lawyer_id_profiles_fkey;
alter table public.dosyalar validate constraint dosyalar_client_id_profiles_fkey;
alter table public.dosyalar validate constraint dosyalar_category_id_categories_fkey;
alter table public.dosyalar validate constraint dosyalar_status_id_statuses_fkey;
alter table public.dosya_documents validate constraint dosya_documents_dosya_id_dosyalar_fkey;
alter table public.dosya_documents validate constraint dosya_documents_uploaded_by_profiles_fkey;
alter table public.dosya_status_updates validate constraint dosya_status_updates_dosya_id_dosyalar_fkey;
alter table public.dosya_status_updates validate constraint dosya_status_updates_status_id_statuses_fkey;
alter table public.dosya_status_updates validate constraint dosya_status_updates_updated_by_profiles_fkey;
alter table public.appointments validate constraint appointments_lawyer_id_profiles_fkey;
alter table public.appointments validate constraint appointments_client_id_profiles_fkey;
alter table public.messages validate constraint messages_sender_id_profiles_fkey;
alter table public.messages validate constraint messages_receiver_id_profiles_fkey;
alter table public.messages validate constraint messages_dosya_id_dosyalar_fkey;
alter table public.notifications validate constraint notifications_user_id_profiles_fkey;
alter table public.audit_logs validate constraint audit_logs_user_id_profiles_fkey;
alter table public.categories validate constraint categories_created_by_profiles_fkey;
alter table public.statuses validate constraint statuses_created_by_profiles_fkey;
