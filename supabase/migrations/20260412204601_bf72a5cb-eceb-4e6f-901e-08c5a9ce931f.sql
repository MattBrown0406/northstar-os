-- Track re-audit history so previous audits aren't lost
CREATE TABLE IF NOT EXISTS public.audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  audit_data JSONB NOT NULL,
  report_data JSONB,
  audit_number INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit history"
  ON public.audit_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit history"
  ON public.audit_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit history"
  ON public.audit_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can view client audit history"
  ON public.audit_history FOR SELECT
  USING (public.is_client_of(auth.uid(), user_id));