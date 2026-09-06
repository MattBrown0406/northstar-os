BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path=public,extensions;
SELECT no_plan();
INSERT INTO auth.users(id,email) VALUES
('11111111-1111-4111-8111-111111111111','coach-test@example.invalid'),
('22222222-2222-4222-8222-222222222222','client-test@example.invalid'),
('33333333-3333-4333-8333-333333333333','other-test@example.invalid');
UPDATE profiles SET plan_tier='coach' WHERE user_id='11111111-1111-4111-8111-111111111111';
UPDATE profiles SET plan_tier='premium' WHERE user_id='22222222-2222-4222-8222-222222222222';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
SELECT lives_ok($$SELECT coach_create_invite('exec','test')$$,'active coach creates own invite');
SELECT throws_ok($$SELECT coach_create_invite('coach',NULL)$$,'22023',NULL,'cannot grant coach tier');
SELECT ok(NOT has_function_privilege(current_user,'public.coach_accept_invite(uuid,text,uuid)','EXECUTE'),'authenticated cannot smuggle client identity');
SELECT throws_ok($$SELECT coach_delete_invite('99999999-9999-4999-8999-999999999999')$$,'P0002',NULL,'missing delete is honest');
SELECT set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
SELECT throws_ok($$SELECT coach_create_invite('free',NULL)$$,'42501',NULL,'noncoach cannot invite');
RESET ROLE;
UPDATE coach_invite_links SET invite_code='audit-code',max_uses=1 WHERE label='test';
SET LOCAL ROLE service_role;
SELECT lives_ok($$SELECT coach_accept_invite('22222222-2222-4222-8222-222222222222','audit-code',NULL)$$,'service accepts consent');
SELECT lives_ok($$SELECT coach_accept_invite('22222222-2222-4222-8222-222222222222','audit-code',NULL)$$,'retry idempotent');
SELECT is((SELECT uses_count FROM coach_invite_links WHERE invite_code='audit-code'),1,'count incremented once');
SELECT is((SELECT count(*)::integer FROM coach_clients),1,'single pair');
SELECT is((SELECT plan_tier::text FROM profiles WHERE user_id='22222222-2222-4222-8222-222222222222'),'premium','paid tier preserved');
SELECT throws_ok($$SELECT coach_accept_invite('33333333-3333-4333-8333-333333333333','audit-code',NULL)$$,'22023',NULL,'usage limit enforced');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
SELECT lives_ok($$SELECT coach_update_client_tier((SELECT id FROM coach_clients LIMIT 1),'free')$$,'coach can change consented tier');
RESET ROLE;
SELECT is((SELECT plan_tier::text FROM profiles WHERE user_id='22222222-2222-4222-8222-222222222222'),'premium','downgrade preserves paid tier');
UPDATE profiles SET is_active=false WHERE user_id='11111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT throws_ok($$SELECT coach_create_invite('free',NULL)$$,'42501',NULL,'inactive coach rejected');
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
