BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();
INSERT INTO auth.users(id,email) VALUES
('11111111-1111-4111-8111-111111111111','audit-user@example.invalid'),
('22222222-2222-4222-8222-222222222222','audit-victim@example.invalid'),
('33333333-3333-4333-8333-333333333333','audit-coach@example.invalid');
UPDATE profiles SET plan_tier='coach' WHERE user_id='33333333-3333-4333-8333-333333333333';
INSERT INTO baseline_audits(id,user_id) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222');
INSERT INTO strategic_reports(id,user_id) VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222');
INSERT INTO coach_clients(coach_user_id,client_user_id) VALUES ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222');
INSERT INTO coach_annotations(coach_id,client_user_id,annotation_type,content,is_private) VALUES
('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','note','private',true),
('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','note','shared',false);
SELECT ok(NOT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity),'all public tables enable RLS');
SELECT ok(NOT has_table_privilege('authenticated','public.coach_clients','INSERT'),'membership INSERT backend only');
SELECT ok(NOT has_table_privilege('authenticated','public.coach_clients','UPDATE'),'membership UPDATE backend only');
SELECT ok(NOT has_table_privilege('authenticated','public.coach_invite_links','INSERT'),'invite INSERT backend only');
SELECT ok(NOT has_table_privilege('authenticated','public.profiles','TRUNCATE'),'no RLS bypass via TRUNCATE');
SELECT ok(NOT has_function_privilege('anon','public.has_role(uuid,public.app_role)','EXECUTE'),'anon cannot probe roles');
SELECT ok(NOT has_function_privilege('anon','public.is_client_of(uuid,uuid)','EXECUTE'),'anon cannot probe membership');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
SELECT is((SELECT count(*)::int FROM profiles),1,'only own profile');
SELECT is((SELECT count(*)::int FROM baseline_audits),0,'cannot read victim audit');
SELECT is((SELECT count(*)::int FROM strategic_reports),0,'cannot read victim report');
SELECT throws_ok($$UPDATE profiles SET plan_tier='coach' WHERE user_id=auth.uid()$$,'42501','Profile entitlements and identity are server managed','cannot self-upgrade');
SELECT throws_ok($$UPDATE profiles SET is_active=false WHERE user_id=auth.uid()$$,'42501','Profile entitlements and identity are server managed','cannot alter activation');
SELECT lives_ok($$UPDATE profiles SET display_name='Safe edit' WHERE user_id=auth.uid()$$,'ordinary profile edits work');
SELECT throws_ok($$INSERT INTO user_roles(user_id,role) VALUES(auth.uid(),'admin')$$,'42501',NULL,'cannot self-assign admin');
SELECT throws_ok($$INSERT INTO coach_clients(coach_user_id,client_user_id) VALUES(auth.uid(),'22222222-2222-4222-8222-222222222222')$$,'42501',NULL,'cannot fabricate membership');
SELECT throws_ok($$INSERT INTO strategic_reports(user_id,audit_id) VALUES(auth.uid(),'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,'23514','Invalid owned audit reference','cannot link victim audit');
SELECT throws_ok($$INSERT INTO plan_action_completions(user_id,report_id,phase_index,action_index) VALUES(auth.uid(),'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,0)$$,'23514','Invalid owned report reference','cannot link victim report');
SELECT is(public.is_client_of('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222'),false,'cannot probe another coach relationship');
SELECT set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
SELECT is((SELECT count(*)::int FROM baseline_audits),1,'legitimate coach reads accepted client audit');
SELECT throws_ok($$INSERT INTO coach_clients(coach_user_id,client_user_id) VALUES(auth.uid(),'11111111-1111-4111-8111-111111111111')$$,'42501',NULL,'even paid coach cannot fabricate membership');
SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
SELECT is((SELECT count(*)::int FROM coach_annotations),1,'client sees shared annotation only');
RESET ROLE;
DELETE FROM profiles WHERE user_id='11111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
SELECT throws_ok($$INSERT INTO profiles(user_id,plan_tier) VALUES(auth.uid(),'coach')$$,'42501','Profile entitlements are server managed','insert cannot bypass entitlement guard');
SELECT lives_ok($$INSERT INTO profiles(user_id) VALUES(auth.uid())$$,'free profile bootstrap works');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT lives_ok($$UPDATE profiles SET plan_tier='premium' WHERE user_id='11111111-1111-4111-8111-111111111111'$$,'service role can assign entitlement');
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
