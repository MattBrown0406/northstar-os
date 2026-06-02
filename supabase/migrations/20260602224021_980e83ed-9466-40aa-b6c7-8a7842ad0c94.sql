ALTER TABLE public.revenuecat_events
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ios'
  CHECK (source IN ('ios', 'web'));