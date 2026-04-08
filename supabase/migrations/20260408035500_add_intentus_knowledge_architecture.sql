ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS intent_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.strategic_reports
  ADD COLUMN IF NOT EXISTS intent_model JSONB NOT NULL DEFAULT '{}'::jsonb;
