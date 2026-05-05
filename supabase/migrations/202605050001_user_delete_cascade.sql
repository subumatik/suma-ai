create or replace function pg_temp.recreate_fk(
  p_table regclass,
  p_column text,
  p_constraint text,
  p_ref_table regclass,
  p_ref_column text,
  p_on_delete text
) returns void as $$
declare
  existing_constraint text;
begin
  for existing_constraint in
    select c.conname
    from pg_constraint c
    join unnest(c.conkey) key(attnum) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = key.attnum
    where c.conrelid = p_table
      and c.contype = 'f'
      and a.attname = p_column
  loop
    execute format('alter table %s drop constraint %I', p_table, existing_constraint);
  end loop;

  execute format(
    'alter table %s add constraint %I foreign key (%I) references %s(%I) on delete %s not valid',
    p_table,
    p_constraint,
    p_column,
    p_ref_table,
    p_ref_column,
    p_on_delete
  );
end;
$$ language plpgsql;

select pg_temp.recreate_fk('public.profiles', 'id', 'profiles_id_auth_users_fkey', 'auth.users', 'id', 'cascade');

select pg_temp.recreate_fk('public.dosyalar', 'lawyer_id', 'dosyalar_lawyer_id_profiles_fkey', 'public.profiles', 'id', 'cascade');
select pg_temp.recreate_fk('public.dosyalar', 'client_id', 'dosyalar_client_id_profiles_fkey', 'public.profiles', 'id', 'cascade');
select pg_temp.recreate_fk('public.dosyalar', 'category_id', 'dosyalar_category_id_categories_fkey', 'public.categories', 'id', 'set null');

select pg_temp.recreate_fk('public.dosya_documents', 'dosya_id', 'dosya_documents_dosya_id_dosyalar_fkey', 'public.dosyalar', 'id', 'cascade');
select pg_temp.recreate_fk('public.dosya_documents', 'uploaded_by', 'dosya_documents_uploaded_by_profiles_fkey', 'public.profiles', 'id', 'cascade');

select pg_temp.recreate_fk('public.dosya_status_updates', 'dosya_id', 'dosya_status_updates_dosya_id_dosyalar_fkey', 'public.dosyalar', 'id', 'cascade');
select pg_temp.recreate_fk('public.dosya_status_updates', 'updated_by', 'dosya_status_updates_updated_by_profiles_fkey', 'public.profiles', 'id', 'cascade');

select pg_temp.recreate_fk('public.appointments', 'lawyer_id', 'appointments_lawyer_id_profiles_fkey', 'public.profiles', 'id', 'cascade');
select pg_temp.recreate_fk('public.appointments', 'client_id', 'appointments_client_id_profiles_fkey', 'public.profiles', 'id', 'cascade');

select pg_temp.recreate_fk('public.messages', 'sender_id', 'messages_sender_id_profiles_fkey', 'public.profiles', 'id', 'cascade');
select pg_temp.recreate_fk('public.messages', 'receiver_id', 'messages_receiver_id_profiles_fkey', 'public.profiles', 'id', 'cascade');
select pg_temp.recreate_fk('public.messages', 'dosya_id', 'messages_dosya_id_dosyalar_fkey', 'public.dosyalar', 'id', 'cascade');

select pg_temp.recreate_fk('public.notifications', 'user_id', 'notifications_user_id_profiles_fkey', 'public.profiles', 'id', 'cascade');

alter table public.categories alter column created_by drop not null;
alter table public.statuses alter column created_by drop not null;

select pg_temp.recreate_fk('public.categories', 'created_by', 'categories_created_by_profiles_fkey', 'public.profiles', 'id', 'set null');
select pg_temp.recreate_fk('public.statuses', 'created_by', 'statuses_created_by_profiles_fkey', 'public.profiles', 'id', 'set null');
select pg_temp.recreate_fk('public.audit_logs', 'user_id', 'audit_logs_user_id_profiles_fkey', 'public.profiles', 'id', 'set null');
