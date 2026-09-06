-- Entitlements and relationship acceptance are server-authoritative.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.plan_tier IS DISTINCT FROM 'free'::public.plan_tier OR NEW.is_active IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Profile entitlements are server managed' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier OR NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile entitlements and identity are server managed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER prevent_profile_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- A paid coach must not be able to select an arbitrary victim as their client.
-- Membership creation and assigned-tier changes require the validated invite backend.
REVOKE INSERT, UPDATE ON public.coach_clients FROM anon, authenticated;
DROP POLICY "Coaches can insert clients" ON public.coach_clients;
DROP POLICY "Coaches can update own clients" ON public.coach_clients;
-- Invite creation, tier validation and redemption counters belong to backend.
REVOKE INSERT, UPDATE ON public.coach_invite_links FROM anon, authenticated;
DROP POLICY "Coaches can create invite links" ON public.coach_invite_links;
DROP POLICY "Coaches can update own invite links" ON public.coach_invite_links;

CREATE OR REPLACE FUNCTION public.is_coach(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _user_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.profiles WHERE user_id = _user_id AND plan_tier = 'coach' AND is_active)
$$;
CREATE OR REPLACE FUNCTION public.is_client_of(_coach_id uuid, _client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _coach_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.coach_clients c JOIN public.profiles p ON p.user_id = c.coach_user_id
 WHERE c.coach_user_id = _coach_id AND c.client_user_id = _client_id
 AND p.plan_tier = 'coach' AND p.is_active)
$$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _user_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.is_coach(uuid), public.is_client_of(uuid, uuid), public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_coach(uuid), public.is_client_of(uuid, uuid), public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user(), public.prevent_profile_privilege_escalation(), public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- Policy helpers are intentionally still executable for authenticated RLS evaluation.
-- No client access at all to webhook payloads except the explicit admin SELECT policy.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.revenuecat_events FROM anon, authenticated;
REVOKE ALL ON public.revenuecat_events FROM anon;
-- TRUNCATE bypasses RLS: remove ambient dangerous table grants in the exposed schema.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Validate foreign-object ownership without exposing the referenced row contents.
CREATE FUNCTION public.validate_owned_references()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF TG_TABLE_NAME = 'strategic_reports' THEN
   IF NEW.audit_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.baseline_audits WHERE id = NEW.audit_id AND user_id = NEW.user_id) THEN
     RAISE EXCEPTION 'Invalid owned audit reference' USING ERRCODE = '23514';
   END IF;
 ELSIF TG_TABLE_NAME = 'plan_action_completions' THEN
   IF NOT EXISTS (SELECT 1 FROM public.strategic_reports WHERE id = NEW.report_id AND user_id = NEW.user_id) THEN
     RAISE EXCEPTION 'Invalid owned report reference' USING ERRCODE = '23514';
   END IF;
 ELSIF TG_TABLE_NAME = 'commitment_callbacks' THEN
   IF NOT EXISTS (SELECT 1 FROM public.check_ins WHERE id = NEW.check_in_id AND user_id = NEW.user_id) OR
      (NEW.previous_commitment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.weekly_commitments WHERE id = NEW.previous_commitment_id AND user_id = NEW.user_id)) THEN
     RAISE EXCEPTION 'Invalid owned commitment reference' USING ERRCODE = '23514';
   END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_owned_references() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_owned_references BEFORE INSERT OR UPDATE ON public.strategic_reports FOR EACH ROW EXECUTE FUNCTION public.validate_owned_references();
CREATE TRIGGER validate_owned_references BEFORE INSERT OR UPDATE ON public.plan_action_completions FOR EACH ROW EXECUTE FUNCTION public.validate_owned_references();
CREATE TRIGGER validate_owned_references BEFORE INSERT OR UPDATE ON public.commitment_callbacks FOR EACH ROW EXECUTE FUNCTION public.validate_owned_references();
