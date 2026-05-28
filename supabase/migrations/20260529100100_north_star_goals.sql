CREATE TABLE public.north_star_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horizon TEXT NOT NULL CHECK (horizon IN ('1_year', '3_year', '5_year')),
  title TEXT NOT NULL,
  description TEXT,
  why TEXT,
  success_looks_like TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.north_star_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own north star goals"
  ON public.north_star_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_north_star_goals_user
  ON public.north_star_goals (user_id, horizon, is_active);

CREATE OR REPLACE FUNCTION update_north_star_goals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_north_star_goals_updated_at
  BEFORE UPDATE ON public.north_star_goals
  FOR EACH ROW EXECUTE FUNCTION update_north_star_goals_updated_at();

NOTIFY pgrst, 'reload schema';
