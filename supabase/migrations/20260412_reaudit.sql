-- Track re-audit history so previous audits aren't lost
CREATE TABLE IF NOT EXISTS audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audit_data JSONB NOT NULL,           -- snapshot of the completed audit answers
  report_data JSONB,                   -- snapshot of the generated report
  audit_number INTEGER NOT NULL DEFAULT 1,  -- 1 = original, 2 = first re-audit, etc.
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit_history"
  ON audit_history FOR ALL USING (auth.uid() = user_id);
