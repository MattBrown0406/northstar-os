
-- Coach-client relationship table
CREATE TABLE public.coach_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  assigned_tier public.plan_tier NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_user_id, client_user_id)
);

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own clients"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can insert clients"
  ON public.coach_clients FOR INSERT
  WITH CHECK (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can update own clients"
  ON public.coach_clients FOR UPDATE
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can delete own clients"
  ON public.coach_clients FOR DELETE
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Clients can view own coach link"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = client_user_id);

-- Coach invite links table
CREATE TABLE public.coach_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  assigned_tier public.plan_tier NOT NULL DEFAULT 'free',
  label text,
  is_active boolean NOT NULL DEFAULT true,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own invite links"
  ON public.coach_invite_links FOR SELECT
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can create invite links"
  ON public.coach_invite_links FOR INSERT
  WITH CHECK (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can update own invite links"
  ON public.coach_invite_links FOR UPDATE
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can delete own invite links"
  ON public.coach_invite_links FOR DELETE
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Anyone can read active invite links"
  ON public.coach_invite_links FOR SELECT
  USING (is_active = true);

-- Security definer functions
CREATE OR REPLACE FUNCTION public.is_coach(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND plan_tier = 'coach'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_client_of(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_clients
    WHERE coach_user_id = _coach_id AND client_user_id = _client_id
  )
$$;

-- Coach access to client data
CREATE POLICY "Coaches can view client audits"
  ON public.baseline_audits FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Coaches can view client reports"
  ON public.strategic_reports FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Coaches can update client reports"
  ON public.strategic_reports FOR UPDATE
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Coaches can view client check_ins"
  ON public.check_ins FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Coaches can view client profiles"
  ON public.profiles FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));
