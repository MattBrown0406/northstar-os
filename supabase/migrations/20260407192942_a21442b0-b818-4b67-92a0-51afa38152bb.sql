
-- Coach branding table
CREATE TABLE public.coach_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  company_name text,
  website_url text,
  logo_url text,
  headshot_url text,
  brand_primary text DEFAULT '#14B8A6',
  brand_secondary text DEFAULT '#F97316',
  brand_foreground text DEFAULT '#ffffff',
  tagline text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_branding ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own branding
CREATE POLICY "Coaches can view own branding"
  ON public.coach_branding FOR SELECT
  USING (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can insert own branding"
  ON public.coach_branding FOR INSERT
  WITH CHECK (auth.uid() = coach_user_id);

CREATE POLICY "Coaches can update own branding"
  ON public.coach_branding FOR UPDATE
  USING (auth.uid() = coach_user_id);

-- Anyone can view branding by slug (for branded login pages)
CREATE POLICY "Public can view branding by slug"
  ON public.coach_branding FOR SELECT
  USING (true);

-- Updated at trigger
CREATE TRIGGER update_coach_branding_updated_at
  BEFORE UPDATE ON public.coach_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for coach assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-assets', 'coach-assets', true);

-- Anyone can view coach assets (public bucket)
CREATE POLICY "Public can view coach assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coach-assets');

-- Coaches can upload their own assets
CREATE POLICY "Coaches can upload own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'coach-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Coaches can update their own assets
CREATE POLICY "Coaches can update own assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'coach-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Coaches can delete their own assets
CREATE POLICY "Coaches can delete own assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'coach-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
