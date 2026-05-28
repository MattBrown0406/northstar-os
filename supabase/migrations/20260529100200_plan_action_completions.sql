CREATE TABLE public.plan_action_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.strategic_reports(id) ON DELETE CASCADE,
  phase_index INTEGER NOT NULL CHECK (phase_index IN (0, 1, 2)),
  action_index INTEGER NOT NULL CHECK (action_index >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_id, phase_index, action_index)
);

ALTER TABLE public.plan_action_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plan completions"
  ON public.plan_action_completions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_plan_completions_report
  ON public.plan_action_completions (report_id, user_id);

NOTIFY pgrst, 'reload schema';
