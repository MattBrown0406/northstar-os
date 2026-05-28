
-- 1. Remove public enumeration of invite links. The process-coach-invite edge
--    function uses the service role and does not depend on this policy.
DROP POLICY IF EXISTS "Anyone can read active invite links" ON public.coach_invite_links;

-- 2. Remove unrestricted public SELECT on coach_branding (which leaked every
--    coach's internal UUIDs and all rows). Replace with a narrow function that
--    returns only the fields needed by the branded auth page for a given slug.
DROP POLICY IF EXISTS "Public can view branding by slug" ON public.coach_branding;

CREATE OR REPLACE FUNCTION public.get_public_coach_branding(_slug text)
RETURNS TABLE (
  coach_user_id uuid,
  slug text,
  company_name text,
  logo_url text,
  headshot_url text,
  brand_primary text,
  brand_secondary text,
  brand_foreground text,
  tagline text,
  coach_display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cb.coach_user_id,
    cb.slug,
    cb.company_name,
    cb.logo_url,
    cb.headshot_url,
    cb.brand_primary,
    cb.brand_secondary,
    cb.brand_foreground,
    cb.tagline,
    p.display_name AS coach_display_name
  FROM public.coach_branding cb
  LEFT JOIN public.profiles p ON p.user_id = cb.coach_user_id
  WHERE cb.slug = _slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_coach_branding(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_coach_branding(text) TO anon, authenticated;
