-- ===================================================================
-- Migration: Convert Dosya from single lawyer/client to M2M
-- ===================================================================

BEGIN;

-- 1. Create junction tables
CREATE TABLE IF NOT EXISTS public.dosya_lawyers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dosya_id    uuid        NOT NULL REFERENCES public.dosyalar(id) ON DELETE CASCADE,
  lawyer_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dosya_id, lawyer_id)
);

CREATE INDEX IF NOT EXISTS idx_dosya_lawyers_lawyer_id ON public.dosya_lawyers(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_dosya_lawyers_dosya_id  ON public.dosya_lawyers(dosya_id);

CREATE TABLE IF NOT EXISTS public.dosya_clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dosya_id    uuid        NOT NULL REFERENCES public.dosyalar(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dosya_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_dosya_clients_client_id ON public.dosya_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_dosya_clients_dosya_id  ON public.dosya_clients(dosya_id);

-- 2. Migrate existing data from old columns
INSERT INTO public.dosya_lawyers (dosya_id, lawyer_id)
SELECT id, lawyer_id FROM public.dosyalar
WHERE lawyer_id IS NOT NULL
ON CONFLICT (dosya_id, lawyer_id) DO NOTHING;

INSERT INTO public.dosya_clients (dosya_id, client_id)
SELECT id, client_id FROM public.dosyalar
WHERE client_id IS NOT NULL
ON CONFLICT (dosya_id, client_id) DO NOTHING;

-- 3. Drop old columns from dosyalar
ALTER TABLE public.dosyalar DROP COLUMN IF EXISTS lawyer_id;
ALTER TABLE public.dosyalar DROP COLUMN IF EXISTS client_id;

-- 4. Enable RLS on new tables
ALTER TABLE public.dosya_lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosya_clients ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for dosya_lawyers
DROP POLICY IF EXISTS "dosya_lawyers_select" ON public.dosya_lawyers;
CREATE POLICY "dosya_lawyers_select" ON public.dosya_lawyers
  FOR SELECT
  USING (
    -- Lawyer themselves can see
    lawyer_id = auth.uid()
    OR
    -- Other lawyers on same case can see
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_lawyers.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    -- Clients on same case can see
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = dosya_lawyers.dosya_id AND dc.client_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "dosya_lawyers_insert" ON public.dosya_lawyers;
CREATE POLICY "dosya_lawyers_insert" ON public.dosya_lawyers
  FOR INSERT
  WITH CHECK (
    -- The user is a lawyer on this case (or no lawyers yet on the case and they are inserting themselves)
    lawyer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_lawyers.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','lawyer'))
  );

DROP POLICY IF EXISTS "dosya_lawyers_delete" ON public.dosya_lawyers;
CREATE POLICY "dosya_lawyers_delete" ON public.dosya_lawyers
  FOR DELETE
  USING (
    lawyer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_lawyers.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 6. RLS policies for dosya_clients
DROP POLICY IF EXISTS "dosya_clients_select" ON public.dosya_clients;
CREATE POLICY "dosya_clients_select" ON public.dosya_clients
  FOR SELECT
  USING (
    client_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_clients.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = dosya_clients.dosya_id AND dc.client_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "dosya_clients_insert" ON public.dosya_clients;
CREATE POLICY "dosya_clients_insert" ON public.dosya_clients
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_clients.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','lawyer'))
  );

DROP POLICY IF EXISTS "dosya_clients_delete" ON public.dosya_clients;
CREATE POLICY "dosya_clients_delete" ON public.dosya_clients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_clients.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 7. Update RLS policies on dosyalar table to use junction tables
DROP POLICY IF EXISTS "dosyalar_select" ON public.dosyalar;
DROP POLICY IF EXISTS "dosyalar_insert" ON public.dosyalar;
DROP POLICY IF EXISTS "dosyalar_update" ON public.dosyalar;
DROP POLICY IF EXISTS "dosyalar_delete" ON public.dosyalar;
DROP POLICY IF EXISTS "Users can view own dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "Users can insert dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "Users can update own dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "Users can delete own dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "lawyer_can_view_own_dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "client_can_view_own_dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "lawyer_can_insert_dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "lawyer_can_update_own_dosyalar" ON public.dosyalar;
DROP POLICY IF EXISTS "lawyer_can_delete_own_dosyalar" ON public.dosyalar;

ALTER TABLE public.dosyalar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dosyalar_select" ON public.dosyalar
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosyalar.id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = dosyalar.id AND dc.client_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosyalar_insert" ON public.dosyalar
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','lawyer'))
  );

CREATE POLICY "dosyalar_update" ON public.dosyalar
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosyalar.id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosyalar_delete" ON public.dosyalar
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosyalar.id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 8. Update related tables RLS policies
-- dosya_documents
DROP POLICY IF EXISTS "dosya_documents_select" ON public.dosya_documents;
DROP POLICY IF EXISTS "dosya_documents_insert" ON public.dosya_documents;
DROP POLICY IF EXISTS "dosya_documents_delete" ON public.dosya_documents;
DROP POLICY IF EXISTS "dosya_documents_update" ON public.dosya_documents;

CREATE POLICY "dosya_documents_select" ON public.dosya_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_documents.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = dosya_documents.dosya_id AND dc.client_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosya_documents_insert" ON public.dosya_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_documents.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosya_documents_delete" ON public.dosya_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_documents.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosya_documents_update" ON public.dosya_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_documents.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- dosya_status_updates
DROP POLICY IF EXISTS "dosya_status_updates_select" ON public.dosya_status_updates;
DROP POLICY IF EXISTS "dosya_status_updates_insert" ON public.dosya_status_updates;

CREATE POLICY "dosya_status_updates_select" ON public.dosya_status_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_status_updates.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = dosya_status_updates.dosya_id AND dc.client_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "dosya_status_updates_insert" ON public.dosya_status_updates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = dosya_status_updates.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- hearings
DROP POLICY IF EXISTS "hearings_select" ON public.hearings;
DROP POLICY IF EXISTS "hearings_insert" ON public.hearings;
DROP POLICY IF EXISTS "hearings_update" ON public.hearings;
DROP POLICY IF EXISTS "hearings_delete" ON public.hearings;

CREATE POLICY "hearings_select" ON public.hearings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = hearings.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.dosya_clients dc
      WHERE dc.dosya_id = hearings.dosya_id AND dc.client_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "hearings_insert" ON public.hearings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = hearings.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "hearings_update" ON public.hearings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = hearings.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "hearings_delete" ON public.hearings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dosya_lawyers dl
      WHERE dl.dosya_id = hearings.dosya_id AND dl.lawyer_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- messages (case messages)
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR (
      dosya_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM public.dosya_lawyers dl
          WHERE dl.dosya_id = messages.dosya_id AND dl.lawyer_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.dosya_clients dc
          WHERE dc.dosya_id = messages.dosya_id AND dc.client_id = auth.uid()
        )
      )
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

COMMIT;
