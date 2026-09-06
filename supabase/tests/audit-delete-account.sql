-- Run with psql -v ON_ERROR_STOP=1 against an isolated schema clone + migration.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
RAISE NOTICE 'PASS: %', label; END $$;
INSERT INTO auth.users(id,email) VALUES
('dddddddd-0000-4000-8000-000000000001','delete@example.test'),
('dddddddd-0000-4000-8000-000000000002','keep@example.test');
DO $$ DECLARE u uuid; BEGIN
FOR u IN SELECT id FROM auth.users LOOP
 INSERT INTO public.audit_history(user_id,audit_data) VALUES(u,'{}');
 INSERT INTO public.coach_branding(coach_user_id,slug) VALUES(u,u::text);
 INSERT INTO public.coach_clients(coach_user_id,client_user_id) VALUES(u,u);
 INSERT INTO public.coach_annotations(coach_id,client_user_id,annotation_type,content) VALUES(u,u,'note','fixture');
 INSERT INTO public.coach_invite_links(coach_user_id) VALUES(u);
 INSERT INTO public.coaching_messages(user_id,role,content) VALUES(u,'user','fixture');
 INSERT INTO public.north_star_goals(user_id,horizon,title) VALUES(u,'1_year','fixture');
 INSERT INTO public.baseline_audits(user_id) VALUES(u);
 INSERT INTO public.strategic_reports(id,user_id) VALUES(u,u);
 INSERT INTO public.plan_action_completions(user_id,report_id,phase_index,action_index) VALUES(u,u,0,0);
 INSERT INTO public.push_tokens(user_id,token) VALUES(u,u::text);
 INSERT INTO public.revenuecat_events(app_user_id,event_type) VALUES(u::text,'TEST');
 INSERT INTO public.check_ins(id,user_id) VALUES(u,u);
 INSERT INTO public.weekly_commitments(id,user_id,week_start,commitment) VALUES(u,u,current_date,'fixture');
 INSERT INTO public.commitment_callbacks(user_id,check_in_id,previous_commitment_id,outcome) VALUES(u,u,u,'yes');
 INSERT INTO public.user_roles(user_id,role) VALUES(u,'admin') ON CONFLICT DO NOTHING;
 INSERT INTO public.rc_entitlement_sources(user_id,source,product_id,tier,active) VALUES(u,'test','test','free',true);
 INSERT INTO public.rc_events(event_id,user_id,app_id,store,environment,product_id,event_type,event_at,outcome) VALUES(u::text,u,'test','APP_STORE','SANDBOX','test','TEST',now(),'ignored');
END LOOP; END $$;
-- Exercise both directions of relationship cleanup.
INSERT INTO public.coach_clients(coach_user_id,client_user_id) VALUES
('dddddddd-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000002'),
('dddddddd-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001');
INSERT INTO public.coach_annotations(coach_id,client_user_id,annotation_type,content) VALUES
('dddddddd-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000002','note','fixture'),
('dddddddd-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001','note','fixture');
CREATE TEMP TABLE before_rows(table_name text, rows jsonb);
DO $$ DECLARE t text; BEGIN
FOR t IN SELECT tablename FROM pg_tables WHERE schemaname IN ('public','auth') LOOP
 IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
 EXECUTE format('INSERT INTO before_rows SELECT %L, coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text),''[]''::jsonb) FROM public.%I x',t,t);
 END IF;
END LOOP; END $$;
CREATE FUNCTION pg_temp.fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected cleanup failure'; END $$;
-- Last cleanup table fails, after earlier deletes have already executed.
CREATE TRIGGER test_delete_failure BEFORE DELETE ON public.revenuecat_events FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_delete();
DO $$ BEGIN
 BEGIN
 DELETE FROM auth.users WHERE id='dddddddd-0000-4000-8000-000000000001';
 RAISE EXCEPTION 'expected injected failure';
 EXCEPTION WHEN raise_exception THEN
 IF SQLERRM <> 'injected cleanup failure' THEN RAISE; END IF;
 END;
END $$;
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM auth.users),'failed deletion preserves auth users');
DO $$ DECLARE r record; actual jsonb; BEGIN
FOR r IN SELECT * FROM before_rows LOOP
 EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text),''[]''::jsonb) FROM public.%I x',r.table_name) INTO actual;
 PERFORM pg_temp.assert_true(actual=r.rows,'rollback preserves all rows: '||r.table_name);
END LOOP; END $$;
DROP TRIGGER test_delete_failure ON public.revenuecat_events;
SELECT pg_temp.assert_true(NOT has_function_privilege('anon','account_deletion_private.cleanup_user()','EXECUTE') AND NOT has_function_privilege('authenticated','account_deletion_private.cleanup_user()','EXECUTE') AND NOT has_function_privilege('service_role','account_deletion_private.cleanup_user()','EXECUTE'),'cleanup is not a client RPC');
DELETE FROM auth.users WHERE id='dddddddd-0000-4000-8000-000000000001';
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM auth.users),'successful deletion removes only target auth user');
DO $$ DECLARE r record; actual jsonb; expected jsonb; BEGIN
FOR r IN SELECT * FROM before_rows LOOP
 EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text),''[]''::jsonb) FROM public.%I x',r.table_name) INTO actual;
 SELECT coalesce(jsonb_agg(value ORDER BY value::text),'[]'::jsonb) INTO expected FROM jsonb_array_elements(r.rows)
 WHERE value::text NOT LIKE '%dddddddd-0000-4000-8000-000000000001%';
 PERFORM pg_temp.assert_true(actual=expected,'target purged / other rows identical: '||r.table_name);
END LOOP; END $$;
ROLLBACK;
