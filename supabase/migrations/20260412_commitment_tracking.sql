-- Weekly "one thing" commitments
CREATE TABLE IF NOT EXISTS weekly_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL, -- Monday of the week
  commitment TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('yes', 'partially', 'no')),
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, week_start)
);

-- Check-in commitment callbacks (links check-in to previous commitment)
CREATE TABLE IF NOT EXISTS commitment_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_id UUID NOT NULL, -- references check_ins table
  previous_commitment_id UUID REFERENCES weekly_commitments(id),
  previous_commitment_text TEXT,
  outcome TEXT CHECK (outcome IN ('yes', 'partially', 'no')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE weekly_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_callbacks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own weekly_commitments"
  ON weekly_commitments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own commitment_callbacks"
  ON commitment_callbacks FOR ALL USING (auth.uid() = user_id);
