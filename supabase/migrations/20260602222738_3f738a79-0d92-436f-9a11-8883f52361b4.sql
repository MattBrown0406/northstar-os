-- RevenueCat webhook event log (service-role only; no end-user access)
CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  app_user_id TEXT NOT NULL,
  product_id TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.revenuecat_events TO service_role;

ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated — webhook only, service role bypasses RLS.

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_app_user
  ON public.revenuecat_events (app_user_id, processed_at DESC);

-- Add optional gender field to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));
