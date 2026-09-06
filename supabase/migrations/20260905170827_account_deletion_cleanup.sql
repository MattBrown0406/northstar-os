-- Cleanup is part of the authoritative Auth hard-delete transaction, never a
-- series of PostgREST requests. Errors intentionally propagate and roll back.
CREATE SCHEMA IF NOT EXISTS account_deletion_private;
REVOKE ALL ON SCHEMA account_deletion_private FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION account_deletion_private.cleanup_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_clients uuid[];
  client_id uuid;
BEGIN
  IF TG_TABLE_SCHEMA <> 'auth' OR TG_TABLE_NAME <> 'users' OR TG_OP <> 'DELETE' THEN
    RAISE EXCEPTION 'auth user deletion trigger only';
  END IF;
  -- Remove dependent callbacks before weekly commitment FK cascades. References
  -- owned by another user are retained, but detached from the deleted commitment.
  DELETE FROM public.commitment_callbacks WHERE user_id = OLD.id;
  UPDATE public.commitment_callbacks SET previous_commitment_id = NULL
    WHERE previous_commitment_id IN
      (SELECT id FROM public.weekly_commitments WHERE user_id = OLD.id);
  DELETE FROM public.coach_annotations WHERE coach_id = OLD.id OR client_user_id = OLD.id;
  SELECT coalesce(array_agg(DISTINCT client_user_id), ARRAY[]::uuid[])
    INTO affected_clients FROM public.coach_clients
    WHERE coach_user_id = OLD.id AND client_user_id <> OLD.id;
  DELETE FROM public.coach_clients WHERE coach_user_id = OLD.id OR client_user_id = OLD.id;
  -- Revoke derived coach access without removing a client's independent grants.
  FOREACH client_id IN ARRAY affected_clients LOOP
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = client_id) THEN
      PERFORM public.recompute_user_plan(client_id);
    END IF;
  END LOOP;
  DELETE FROM public.coach_invite_links WHERE coach_user_id = OLD.id;
  DELETE FROM public.coach_branding WHERE coach_user_id = OLD.id;
  DELETE FROM public.coaching_messages WHERE user_id = OLD.id;
  DELETE FROM public.north_star_goals WHERE user_id = OLD.id;
  DELETE FROM public.plan_action_completions WHERE user_id = OLD.id;
  DELETE FROM public.audit_history WHERE user_id = OLD.id;
  DELETE FROM public.push_tokens WHERE user_id = OLD.id;
  DELETE FROM public.revenuecat_events WHERE app_user_id = OLD.id::text;
  -- Auth-linked tables (including entitlement sources/events/roles) cascade.
  -- Storage objects are not SQL-deleted: that would orphan the physical blob.
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION account_deletion_private.cleanup_user() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER cleanup_account_before_auth_delete
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION account_deletion_private.cleanup_user();
