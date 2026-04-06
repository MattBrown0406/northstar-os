
-- Create enums
CREATE TYPE public.coaching_tone AS ENUM ('direct', 'supportive', 'balanced');
CREATE TYPE public.check_in_cadence AS ENUM ('daily', 'every_other_day', 'weekly');
CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE public.audit_status AS ENUM ('in_progress', 'completed');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  coaching_tone coaching_tone DEFAULT 'balanced',
  check_in_cadence check_in_cadence DEFAULT 'daily',
  plan_tier plan_tier DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Baseline audits
CREATE TABLE public.baseline_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status audit_status DEFAULT 'in_progress',
  current_section INT DEFAULT 0,
  current_question INT DEFAULT 0,
  responses JSONB DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.baseline_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audits" ON public.baseline_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audits" ON public.baseline_audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audits" ON public.baseline_audits FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON public.baseline_audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Strategic reports
CREATE TABLE public.strategic_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.baseline_audits(id) ON DELETE SET NULL,
  north_star_focus TEXT,
  contradictions JSONB DEFAULT '[]',
  ninety_day_plan JSONB DEFAULT '{}',
  pattern_analysis JSONB DEFAULT '{}',
  forced_choice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.strategic_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reports" ON public.strategic_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.strategic_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.strategic_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Check-ins
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score INT CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_score INT CHECK (energy_score >= 1 AND energy_score <= 10),
  wins TEXT[],
  blockers TEXT[],
  commitments TEXT[],
  drift_detected BOOLEAN DEFAULT false,
  ai_response JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own check_ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own check_ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check_ins" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);
