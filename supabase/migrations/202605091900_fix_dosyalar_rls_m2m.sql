-- Fix dosyalar RLS policies for M2M relations (dosya_lawyers / dosya_clients)
-- and created_by ownership.

-- 1. Recreate has_dosya_access to use M2M tables
CREATE OR REPLACE FUNCTION app_private.has_dosya_access(p_dosya_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN COALESCE(app_private.is_admin(), false)
    OR EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = p_dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = p_dosya_id AND dc.client_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dosyalar d
      WHERE d.id = p_dosya_id AND d.created_by = auth.uid()
    );
END;
$$;

-- 2. Fix dosyalar SELECT policy
drop policy if exists "dosyalar_select_participant_or_admin" on public.dosyalar;
create policy "dosyalar_select_participant_or_admin"
  on public.dosyalar for select to authenticated
  using (
    exists (select 1 from public.dosya_lawyers dl where dl.dosya_id = id and dl.lawyer_id = auth.uid())
    or exists (select 1 from public.dosya_clients dc where dc.dosya_id = id and dc.client_id = auth.uid())
    or created_by = auth.uid()
    or app_private.is_admin()
  );

-- 3. Fix dosyalar INSERT policy
drop policy if exists "dosyalar_insert_lawyer_or_admin" on public.dosyalar;
create policy "dosyalar_insert_lawyer_or_admin"
  on public.dosyalar for insert to authenticated
  with check (
    (app_private.current_user_role() = 'lawyer' and created_by = auth.uid())
    or app_private.is_admin()
  );

-- 4. Fix dosyalar UPDATE policy
drop policy if exists "dosyalar_update_lawyer_or_admin" on public.dosyalar;
create policy "dosyalar_update_lawyer_or_admin"
  on public.dosyalar for update to authenticated
  using (
    exists (
      select 1 from public.dosya_lawyers dl
      where dl.dosya_id = id and dl.lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer'
    )
    or app_private.is_admin()
  )
  with check (
    exists (
      select 1 from public.dosya_lawyers dl
      where dl.dosya_id = id and dl.lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer'
    )
    or app_private.is_admin()
  );

-- 5. Fix dosyalar DELETE policy
drop policy if exists "dosyalar_delete_lawyer_or_admin" on public.dosyalar;
create policy "dosyalar_delete_lawyer_or_admin"
  on public.dosyalar for delete to authenticated
  using (
    exists (
      select 1 from public.dosya_lawyers dl
      where dl.dosya_id = id and dl.lawyer_id = auth.uid() and app_private.current_user_role() = 'lawyer'
    )
    or app_private.is_admin()
  );
