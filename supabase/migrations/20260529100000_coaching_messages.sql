CREATE TABLE public.coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own coaching messages"
  ON public.coaching_messages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_coaching_messages_user_date
  ON public.coaching_messages (user_id, session_date DESC, created_at DESC);

NOTIFY pgrst, 'reload schema';
