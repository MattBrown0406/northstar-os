-- Global human-coach consent; absent rows retain the existing linked-coach default.
CREATE TABLE public.sharing_preferences (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 human_coach_enabled boolean NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sharing_preference_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 human_coach_enabled boolean NOT NULL,
 scope text NOT NULL DEFAULT 'all_existing_coach_categories_v1',
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_preference_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sharing_preferences, public.sharing_preference_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sharing_preferences, public.sharing_preference_events TO authenticated;
CREATE POLICY sharing_owner_read ON public.sharing_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY sharing_events_owner_read ON public.sharing_preference_events FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_client_of(_coach_id uuid, _client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _coach_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.coach_clients c JOIN public.profiles p ON p.user_id = c.coach_user_id
 LEFT JOIN public.sharing_preferences s ON s.user_id = c.client_user_id
 WHERE c.coach_user_id = _coach_id AND c.client_user_id = _client_id
 AND p.plan_tier = 'coach' AND p.is_active AND coalesce(s.human_coach_enabled, true))
$$;
-- Own annotations were the only coach-content read path outside the helper.
ALTER POLICY "Coaches manage own coach_annotations" ON public.coach_annotations
 USING (auth.uid() = coach_id AND public.is_client_of(auth.uid(), client_user_id))
 WITH CHECK (auth.uid() = coach_id AND public.is_client_of(auth.uid(), client_user_id));

CREATE FUNCTION public.get_coach_sharing() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object(
 'enabled', coalesce((SELECT human_coach_enabled FROM public.sharing_preferences WHERE user_id=auth.uid()),true),
 'legacy', NOT EXISTS(SELECT 1 FROM public.sharing_preferences WHERE user_id=auth.uid()),
 'coaches', coalesce((SELECT jsonb_agg(jsonb_build_object('id', c.coach_user_id, 'name', p.display_name,
 'eligible', coalesce(p.plan_tier='coach' AND p.is_active,false)))
 FROM public.coach_clients c LEFT JOIN public.profiles p ON p.user_id=c.coach_user_id WHERE c.client_user_id=auth.uid()),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END $$;
CREATE FUNCTION public.set_coach_sharing(p_enabled boolean, p_acknowledged boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_acknowledged IS DISTINCT FROM true OR p_enabled IS NULL THEN
 RAISE EXCEPTION 'Authentication and acknowledgement required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.sharing_preferences(user_id,human_coach_enabled) VALUES(auth.uid(),p_enabled)
 ON CONFLICT(user_id) DO UPDATE SET human_coach_enabled=excluded.human_coach_enabled,updated_at=now();
 INSERT INTO public.sharing_preference_events(user_id,human_coach_enabled) VALUES(auth.uid(),p_enabled);
END $$;
REVOKE ALL ON FUNCTION public.get_coach_sharing(), public.set_coach_sharing(boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_coach_sharing(), public.set_coach_sharing(boolean,boolean) TO authenticated;
COMMENT ON FUNCTION public.get_coach_sharing() IS 'Owner-only consent and linked-coach identity projection. Admin/service operations and AI processing are separate.';
