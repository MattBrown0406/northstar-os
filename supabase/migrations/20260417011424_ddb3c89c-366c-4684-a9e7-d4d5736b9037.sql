-- Add extras jsonb to check_ins to store rotating coaching signals
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Helpful index for querying by extras keys
CREATE INDEX IF NOT EXISTS idx_check_ins_extras ON public.check_ins USING GIN (extras);

-- Index for fast per-user recency lookups already implicit via user_id + created_at;
-- add an explicit composite to speed up rotation queries
CREATE INDEX IF NOT EXISTS idx_check_ins_user_created ON public.check_ins (user_id, created_at DESC);