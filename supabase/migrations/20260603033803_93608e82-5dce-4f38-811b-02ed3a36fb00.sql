
ALTER TABLE public.coach_annotations
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT true;

CREATE POLICY "Clients can view their non-private annotations"
  ON public.coach_annotations
  FOR SELECT
  USING (client_user_id = auth.uid() AND is_private = false);
