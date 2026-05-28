CREATE TABLE public.coach_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('note', 'flag', 'session_prep', 'action_item')),
  content TEXT NOT NULL,
  context_type TEXT CHECK (context_type IN ('report', 'audit', 'check_in', 'general')),
  context_id UUID,
  is_private BOOLEAN NOT NULL DEFAULT true,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own annotations"
  ON public.coach_annotations
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE INDEX idx_coach_annotations_coach_client
  ON public.coach_annotations (coach_id, client_user_id, resolved);

CREATE OR REPLACE FUNCTION update_coach_annotations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_coach_annotations_updated_at
  BEFORE UPDATE ON public.coach_annotations
  FOR EACH ROW EXECUTE FUNCTION update_coach_annotations_updated_at();

-- Add edited plan column to strategic_reports
ALTER TABLE public.strategic_reports
  ADD COLUMN IF NOT EXISTS edited_ninety_day_plan JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);

NOTIFY pgrst, 'reload schema';
