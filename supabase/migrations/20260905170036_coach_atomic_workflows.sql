-- Must follow rc_event_fulfillment: recompute_user_plan(uuid) aggregates paid + coach grants.
ALTER TABLE public.coach_invite_links ADD COLUMN IF NOT EXISTS max_uses integer CHECK (max_uses > 0);
ALTER TABLE public.coach_invite_links ADD COLUMN IF NOT EXISTS expires_at timestamptz;
REVOKE INSERT, UPDATE, DELETE ON public.coach_invite_links FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.coach_clients FROM anon, authenticated;

CREATE FUNCTION public.coach_create_invite(p_tier text, p_label text DEFAULT NULL)
RETURNS public.coach_invite_links LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_row public.coach_invite_links;
BEGIN
 PERFORM 1 FROM public.profiles WHERE user_id=auth.uid() AND plan_tier='coach' AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active coach required' USING ERRCODE='42501'; END IF;
 IF p_tier IS NULL OR p_tier NOT IN ('free','exec','pro','premium') OR length(p_label)>200 THEN
 RAISE EXCEPTION 'Invalid invite tier or label' USING ERRCODE='22023'; END IF;
 INSERT INTO public.coach_invite_links(coach_user_id,assigned_tier,label)
 VALUES(auth.uid(),p_tier::public.plan_tier,nullif(btrim(p_label),'')) RETURNING * INTO v_row;
 RETURN v_row;
END $$;

CREATE FUNCTION public.coach_delete_invite(p_link_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM 1 FROM public.profiles WHERE user_id=auth.uid() AND plan_tier='coach' AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active coach required' USING ERRCODE='42501'; END IF;
 DELETE FROM public.coach_invite_links WHERE id=p_link_id AND coach_user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found' USING ERRCODE='P0002'; END IF;
END $$;

CREATE FUNCTION public.coach_update_client_tier(p_relationship_id uuid,p_tier text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_client uuid;
BEGIN
 IF p_tier IS NULL OR p_tier NOT IN ('free','exec','pro','premium') THEN
 RAISE EXCEPTION 'Invalid client tier' USING ERRCODE='22023'; END IF;
 SELECT client_user_id INTO v_client FROM public.coach_clients WHERE id=p_relationship_id AND coach_user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Client relationship not found' USING ERRCODE='P0002'; END IF;
 -- Same deterministic profile lock order as redemption; RC serializes on the client profile.
 PERFORM 1 FROM public.profiles WHERE user_id IN (auth.uid(),v_client) ORDER BY user_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND plan_tier='coach' AND is_active) THEN
 RAISE EXCEPTION 'Active coach required' USING ERRCODE='42501'; END IF;
 UPDATE public.coach_clients SET assigned_tier=p_tier::public.plan_tier WHERE id=p_relationship_id AND coach_user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Client relationship not found' USING ERRCODE='P0002'; END IF;
 PERFORM public.recompute_user_plan(v_client);
END $$;

-- Only the edge's service client may supply p_client_user_id, derived from auth.getUser().
CREATE FUNCTION public.coach_accept_invite(p_client_user_id uuid,p_invite_code text DEFAULT NULL,p_coach_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_coach uuid; v_link public.coach_invite_links; v_tier public.plan_tier := 'free'; v_id uuid;
BEGIN
 IF p_client_user_id IS NULL THEN RAISE EXCEPTION 'Client required' USING ERRCODE='22023'; END IF;
 IF p_invite_code IS NOT NULL AND p_invite_code <> '__branded__' THEN
 SELECT coach_user_id INTO v_coach FROM public.coach_invite_links WHERE invite_code=p_invite_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invite' USING ERRCODE='22023'; END IF;
 ELSE v_coach := p_coach_user_id;
 END IF;
 IF v_coach IS NULL OR v_coach=p_client_user_id THEN RAISE EXCEPTION 'Invalid coach' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.profiles WHERE user_id IN (v_coach,p_client_user_id) ORDER BY user_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=v_coach AND plan_tier='coach' AND is_active) THEN
 RAISE EXCEPTION 'Active coach required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_client_user_id AND is_active) THEN
 RAISE EXCEPTION 'Active client required' USING ERRCODE='42501'; END IF;
 IF p_invite_code IS NOT NULL AND p_invite_code <> '__branded__' THEN
 SELECT * INTO v_link FROM public.coach_invite_links WHERE invite_code=p_invite_code AND coach_user_id=v_coach FOR UPDATE;
 IF NOT FOUND OR NOT v_link.is_active OR (v_link.expires_at IS NOT NULL AND v_link.expires_at<=clock_timestamp()) THEN
 RAISE EXCEPTION 'Invalid or expired invite' USING ERRCODE='22023'; END IF;
 v_tier := v_link.assigned_tier;
 END IF;
 IF v_tier::text NOT IN ('free','exec','pro','premium') THEN RAISE EXCEPTION 'Invalid invite tier' USING ERRCODE='22023'; END IF;
 SELECT id INTO v_id FROM public.coach_clients WHERE coach_user_id=v_coach AND client_user_id=p_client_user_id;
 IF FOUND THEN RETURN jsonb_build_object('success',true,'coach_user_id',v_coach,'message','Already linked'); END IF;
 IF v_link.max_uses IS NOT NULL AND v_link.uses_count>=v_link.max_uses THEN
 RAISE EXCEPTION 'Invite usage limit reached' USING ERRCODE='22023'; END IF;
 -- Existing UNIQUE(coach_user_id,client_user_id) is the final concurrency backstop.
 INSERT INTO public.coach_clients(coach_user_id,client_user_id,assigned_tier)
 VALUES(v_coach,p_client_user_id,v_tier);
 IF v_link.id IS NOT NULL THEN UPDATE public.coach_invite_links SET uses_count=uses_count+1 WHERE id=v_link.id; END IF;
 PERFORM public.recompute_user_plan(p_client_user_id);
 RETURN jsonb_build_object('success',true,'coach_user_id',v_coach);
END $$;
-- Ownership transfer needs CREATE on the containing schema. Grant it only
-- inside this transaction if absent, then restore the original privilege.
DO $$
DECLARE had_create boolean := has_schema_privilege('service_role','public','CREATE');
BEGIN
 IF NOT had_create THEN GRANT CREATE ON SCHEMA public TO service_role; END IF;
 ALTER FUNCTION public.coach_update_client_tier(uuid,text) OWNER TO service_role;
 ALTER FUNCTION public.coach_accept_invite(uuid,text,uuid) OWNER TO service_role;
 IF NOT had_create THEN REVOKE CREATE ON SCHEMA public FROM service_role; END IF;
END $$;
REVOKE ALL ON FUNCTION public.coach_create_invite(text,text),public.coach_delete_invite(uuid),public.coach_update_client_tier(uuid,text),public.coach_accept_invite(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.coach_create_invite(text,text),public.coach_delete_invite(uuid),public.coach_update_client_tier(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_accept_invite(uuid,text,uuid) TO service_role;
