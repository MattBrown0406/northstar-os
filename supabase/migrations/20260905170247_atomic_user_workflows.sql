-- Transaction boundaries for user workflows. Identity is always the verified JWT subject.
CREATE TABLE public.user_workflow_operations (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 operation_id uuid NOT NULL,
 kind text NOT NULL CHECK (kind IN ('reaudit','checkin')),
 result jsonb NOT NULL,
 PRIMARY KEY(user_id, operation_id, kind)
);
ALTER TABLE public.user_workflow_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_workflow_operations FROM PUBLIC, anon, authenticated;
-- History is server-authored; clients must not forge cooldowns or sequence numbers.
REVOKE INSERT, UPDATE, DELETE ON public.audit_history FROM anon, authenticated;

CREATE FUNCTION public.archive_and_reset_audit(p_audit_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE u uuid := auth.uid(); a public.baseline_audits; r public.strategic_reports; n integer; prior jsonb; tier text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 -- Coordinate with ordinary direct inserts/edits too, not only other RPC callers.
 LOCK TABLE public.baseline_audits, public.strategic_reports IN SHARE ROW EXCLUSIVE MODE;
 SELECT plan_tier::text INTO tier FROM public.profiles WHERE user_id=u FOR UPDATE;
 SELECT result INTO prior FROM public.user_workflow_operations WHERE user_id=u AND operation_id=p_audit_id AND kind='reaudit';
 IF FOUND THEN RETURN (prior->>'audit_number')::integer; END IF;
 IF tier IS NULL OR tier NOT IN ('premium','coach') THEN RAISE EXCEPTION 'Premium or Coach plan required' USING ERRCODE='42501'; END IF;
 IF EXISTS (SELECT 1 FROM public.audit_history WHERE user_id=u AND archived_at > now()-interval '30 days') THEN
  RAISE EXCEPTION 'Re-audit cooldown is 30 days' USING ERRCODE='42501';
 END IF;
 SELECT * INTO a FROM public.baseline_audits WHERE id=p_audit_id AND user_id=u AND status='completed' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Completed owned audit required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.strategic_reports WHERE audit_id=a.id AND user_id=u ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE;
 SELECT coalesce(max(audit_number),0)+1 INTO n FROM public.audit_history WHERE user_id=u;
 INSERT INTO public.audit_history(user_id,audit_data,report_data,audit_number,completed_at)
 VALUES(u,to_jsonb(a),CASE WHEN r.id IS NULL THEN NULL ELSE to_jsonb(r) END,n,coalesce(a.completed_at,now()));
 DELETE FROM public.strategic_reports WHERE user_id=u;
 DELETE FROM public.baseline_audits WHERE user_id=u;
 INSERT INTO public.user_workflow_operations VALUES(u,p_audit_id,'reaudit',jsonb_build_object('audit_number',n));
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.archive_and_reset_audit(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.archive_and_reset_audit(uuid) TO authenticated;

CREATE FUNCTION public.save_check_in(p_operation_id uuid, p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
<<save_check_in>>
DECLARE u uuid := auth.uid(); prior jsonb; k text; v jsonb; w date; c public.weekly_commitments; cid uuid; outcome text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'Operation ID required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.profiles WHERE user_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile required' USING ERRCODE='42501'; END IF;
 SELECT result INTO prior FROM public.user_workflow_operations WHERE user_id=u AND operation_id=p_operation_id AND kind='checkin';
 IF FOUND THEN
  IF prior->'payload' IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'Operation already saved with different content; original draft retained' USING ERRCODE='22023'; END IF;
  RETURN (prior->>'check_in_id')::uuid;
 END IF;
 IF p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>65536 THEN
  RAISE EXCEPTION 'Invalid payload' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['mood','energy'] LOOP
  IF NOT (p_payload ? k) OR jsonb_typeof(p_payload->k)<>'number' OR (p_payload->>k) !~ '^(10|[1-9])$' THEN
   RAISE EXCEPTION 'Invalid scale' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['wins','blockers','commitments'] LOOP
  IF jsonb_typeof(p_payload->k) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid list' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(p_payload->k)>50 THEN RAISE EXCEPTION 'List too long' USING ERRCODE='22023'; END IF;
  FOR v IN SELECT value FROM jsonb_array_elements(p_payload->k) LOOP
   IF jsonb_typeof(v)<>'string' OR length(v#>>'{}')>4000 THEN RAISE EXCEPTION 'Invalid list item' USING ERRCODE='22023'; END IF;
  END LOOP;
 END LOOP;
 IF jsonb_typeof(p_payload->'extras') IS DISTINCT FROM 'object' OR jsonb_typeof(p_payload->'quick') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_payload->'oneThing') IS DISTINCT FROM 'string' OR length(p_payload->>'oneThing')>4000
 OR jsonb_typeof(p_payload->'reflection') IS DISTINCT FROM 'string' OR length(p_payload->>'reflection')>4000 THEN
  RAISE EXCEPTION 'Invalid extras or text' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(p_payload->'extras'))>50 THEN RAISE EXCEPTION 'Too many extras' USING ERRCODE='22023'; END IF;
 FOR k,v IN SELECT key,value FROM jsonb_each(p_payload->'extras') LOOP
  IF length(k)>100 OR jsonb_typeof(v) NOT IN ('string','number') OR length(v::text)>4000 THEN RAISE EXCEPTION 'Invalid extra' USING ERRCODE='22023'; END IF;
 END LOOP;
 w := (p_payload->>'weekStart')::date;
 IF w IS NULL OR extract(isodow FROM w)<>1 OR abs(w-current_date)>8 THEN RAISE EXCEPTION 'Invalid week' USING ERRCODE='22023'; END IF;
 outcome := p_payload->>'outcome';
 IF p_payload->>'previousCommitmentId' IS NOT NULL THEN
  IF outcome IS NULL OR outcome NOT IN ('yes','partially','no') THEN RAISE EXCEPTION 'Invalid outcome' USING ERRCODE='22023'; END IF;
  SELECT * INTO c FROM public.weekly_commitments WHERE id=(p_payload->>'previousCommitmentId')::uuid AND user_id=u AND week_start<w FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Owned previous commitment required' USING ERRCODE='42501'; END IF;
 ELSIF outcome IS NOT NULL THEN RAISE EXCEPTION 'Previous commitment required' USING ERRCODE='22023'; END IF;
 INSERT INTO public.check_ins(user_id,mood_score,energy_score,wins,blockers,commitments,drift_detected,extras,is_quick)
 VALUES(u,(p_payload->>'mood')::integer,(p_payload->>'energy')::integer,
 ARRAY(SELECT jsonb_array_elements_text(p_payload->'wins')),ARRAY(SELECT jsonb_array_elements_text(p_payload->'blockers')),
 ARRAY(SELECT jsonb_array_elements_text(p_payload->'commitments')),(p_payload->>'mood')::integer<=4 OR (p_payload->>'energy')::integer<=4,
 p_payload->'extras',(p_payload->>'quick')::boolean) RETURNING id INTO cid;
 IF c.id IS NOT NULL THEN
  UPDATE public.weekly_commitments SET outcome=save_check_in.outcome,reflection=nullif(btrim(p_payload->>'reflection'),''),
   completed_at=CASE WHEN save_check_in.outcome='yes' THEN now() ELSE NULL END WHERE id=c.id AND user_id=u;
  INSERT INTO public.commitment_callbacks(user_id,check_in_id,previous_commitment_id,previous_commitment_text,outcome)
  VALUES(u,cid,c.id,c.commitment,outcome);
 END IF;
 IF btrim(p_payload->>'oneThing')<>'' THEN
  INSERT INTO public.weekly_commitments(user_id,week_start,commitment) VALUES(u,w,btrim(p_payload->>'oneThing'))
  ON CONFLICT(user_id,week_start) DO UPDATE SET commitment=excluded.commitment;
 END IF;
 INSERT INTO public.user_workflow_operations VALUES(u,p_operation_id,'checkin',jsonb_build_object('check_in_id',cid,'payload',p_payload));
 RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.save_check_in(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_check_in(uuid,jsonb) TO authenticated;
