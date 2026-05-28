
-- =========================================================================
-- coaching_messages
-- =========================================================================
CREATE TABLE public.coaching_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  session_date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaching_messages TO authenticated;
GRANT ALL ON public.coaching_messages TO service_role;

ALTER TABLE public.coaching_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coaching_messages"
  ON public.coaching_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view client coaching_messages"
  ON public.coaching_messages FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Admins can view all coaching_messages"
  ON public.coaching_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_coaching_messages_user_date ON public.coaching_messages (user_id, session_date, created_at);

-- =========================================================================
-- north_star_goals
-- =========================================================================
CREATE TABLE public.north_star_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  horizon text NOT NULL CHECK (horizon IN ('1_year','3_year','5_year')),
  title text NOT NULL,
  description text,
  why text,
  success_looks_like text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.north_star_goals TO authenticated;
GRANT ALL ON public.north_star_goals TO service_role;

ALTER TABLE public.north_star_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own north_star_goals"
  ON public.north_star_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view client north_star_goals"
  ON public.north_star_goals FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Admins can view all north_star_goals"
  ON public.north_star_goals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_north_star_goals_updated_at
  BEFORE UPDATE ON public.north_star_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- plan_action_completions
-- =========================================================================
CREATE TABLE public.plan_action_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_id uuid NOT NULL,
  phase_index integer NOT NULL,
  action_index integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_id, phase_index, action_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_action_completions TO authenticated;
GRANT ALL ON public.plan_action_completions TO service_role;

ALTER TABLE public.plan_action_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plan_action_completions"
  ON public.plan_action_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view client plan_action_completions"
  ON public.plan_action_completions FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));

CREATE POLICY "Admins can view all plan_action_completions"
  ON public.plan_action_completions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- coach_annotations
-- =========================================================================
CREATE TABLE public.coach_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  annotation_type text NOT NULL CHECK (annotation_type IN ('note','flag','session_prep','action_item')),
  content text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  context_type text,
  context_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_annotations TO authenticated;
GRANT ALL ON public.coach_annotations TO service_role;

ALTER TABLE public.coach_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own coach_annotations"
  ON public.coach_annotations FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id AND public.is_client_of(auth.uid(), client_user_id));

CREATE POLICY "Admins can view all coach_annotations"
  ON public.coach_annotations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coach_annotations_updated_at
  BEFORE UPDATE ON public.coach_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_coach_annotations_lookup
  ON public.coach_annotations (coach_id, client_user_id, annotation_type, resolved);

-- =========================================================================
-- strategic_reports: editable-plan fields
-- =========================================================================
ALTER TABLE public.strategic_reports
  ADD COLUMN IF NOT EXISTS edited_ninety_day_plan jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_edited_by uuid;
