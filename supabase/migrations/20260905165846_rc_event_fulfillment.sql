-- Configure exact RevenueCat app/store/environment/product tuples as service_role.
-- No invented app identifiers; SANDBOX requires an explicit enabled row.
create table public.rc_product_config (
 app_id text not null check(length(app_id) between 1 and 200),
 store text not null check(store in ('APP_STORE','PLAY_STORE','STRIPE','MAC_APP_STORE','AMAZON')),
 environment text not null check(environment in ('PRODUCTION','SANDBOX')),
 product_id text not null check(product_id in ('intentus_executive_monthly','intentus_premium_monthly','intentus_coach_monthly')),
 enabled boolean not null default false,
 primary key(app_id,store,environment,product_id)
);
create table public.rc_entitlement_sources (
 user_id uuid not null references auth.users(id) on delete cascade,
 source text not null,
 product_id text not null,
 tier public.plan_tier not null,
 expires_at timestamptz,
 event_at timestamptz,
 event_id text,
 active boolean not null,
 primary key(user_id,source,product_id)
);
-- Existing grants are deliberately retained until a privileged reconciliation.
insert into public.rc_entitlement_sources(user_id,source,product_id,tier,active)
 select user_id,'legacy','legacy',plan_tier,true from public.profiles where plan_tier <> 'free';
create table public.rc_events (
 event_id text primary key check(length(event_id) between 1 and 200),
 user_id uuid not null references auth.users(id) on delete cascade,
 app_id text not null, store text not null, environment text not null,
 product_id text not null, event_type text not null,
 event_at timestamptz not null, expires_at timestamptz,
 outcome text not null check(outcome in ('applied','stale','ignored')),
 received_at timestamptz not null default now()
);
alter table public.rc_product_config enable row level security;
alter table public.rc_entitlement_sources enable row level security;
alter table public.rc_events enable row level security;
revoke all on public.rc_product_config,public.rc_entitlement_sources,public.rc_events from public,anon,authenticated;
grant select,insert,update,delete on public.rc_product_config,public.rc_entitlement_sources,public.rc_events to service_role;

-- Capture subsequent external grants, never mistake another provider's tier for RC.
create function public.rc_preserve_external_grant() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(current_setting('rc.applying',true),'') <> 'yes' and new.plan_tier <> 'free' and
 (TG_OP='INSERT' or new.plan_tier is distinct from old.plan_tier) then
 insert into public.rc_entitlement_sources(user_id,source,product_id,tier,active)
 values(new.user_id,'legacy','legacy',new.plan_tier,true)
 on conflict(user_id,source,product_id) do update set tier=excluded.tier,active=true;
 end if;
 return new;
end $$;
revoke all on function public.rc_preserve_external_grant() from public,anon,authenticated;
create trigger rc_preserve_external_grant after insert or update of plan_tier on public.profiles
 for each row execute function public.rc_preserve_external_grant();

create function public.recompute_user_plan(p_user_id uuid) returns public.plan_tier
language plpgsql security invoker set search_path='' as $$
declare v_tier public.plan_tier;
begin
 -- Nested authorized SECURITY DEFINER workflows execute as their owner.
 -- Client roles still have no EXECUTE grant and cannot select source rows.
 if current_user not in ('service_role', 'postgres', 'supabase_admin') then raise exception 'trusted server role required' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user_id for update;
 if not found then raise exception 'profile missing' using errcode='P0002'; end if;
 select case when tier='pro' then 'exec'::public.plan_tier else tier end into v_tier from (
 select tier from public.rc_entitlement_sources where user_id=p_user_id and active and (expires_at is null or expires_at>clock_timestamp())
 union all select cc.assigned_tier from public.coach_clients cc join public.profiles coach on coach.user_id=cc.coach_user_id
 where cc.client_user_id=p_user_id and coach.plan_tier='coach' and cc.assigned_tier in ('free','pro','exec','premium')
 ) grants order by case tier when 'coach' then 4 when 'premium' then 3 when 'exec' then 2 when 'pro' then 2 else 0 end desc limit 1;
 v_tier := coalesce(v_tier,'free'::public.plan_tier);
 perform set_config('rc.applying','yes',true);
 update public.profiles set plan_tier=v_tier where user_id=p_user_id;
 perform set_config('rc.applying','',true);
 return v_tier;
end $$;
revoke all on function public.recompute_user_plan(uuid) from public,anon,authenticated;
grant execute on function public.recompute_user_plan(uuid) to service_role;

create function public.rc_apply_event(p_event_id text,p_user_id uuid,p_app_id text,p_store text,p_environment text,
 p_product_id text,p_event_type text,p_event_at timestamptz,p_expires_at timestamptz)
returns text language plpgsql security invoker set search_path='' as $$
declare v_source text; v_tier public.plan_tier; v_old public.rc_entitlement_sources%rowtype;
 v_event public.rc_events%rowtype; v_outcome text := 'applied'; v_grant boolean;
begin
 if current_user <> 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 if p_event_id is null or length(p_event_id) not between 1 and 200 or p_user_id is null or
 p_event_at is null or not isfinite(p_event_at) or p_event_at < '2020-01-01'::timestamptz or p_event_at > clock_timestamp()+interval '5 minutes' then
 raise exception 'invalid event' using errcode='22023'; end if;
 if not exists(select 1 from public.rc_product_config where app_id=p_app_id and store=p_store and environment=p_environment and product_id=p_product_id and enabled) then
 return 'unconfigured'; end if;
 -- Serialize both same-user changes and event IDs, including cross-user replay.
 perform pg_advisory_xact_lock(hashtextextended('rc-event:'||p_event_id,0));
 select * into v_event from public.rc_events where event_id=p_event_id;
 if found then
 if (v_event.user_id,v_event.app_id,v_event.store,v_event.environment,v_event.product_id,v_event.event_type,v_event.event_at,v_event.expires_at)
 is distinct from (p_user_id,p_app_id,p_store,p_environment,p_product_id,p_event_type,p_event_at,p_expires_at) then
 raise exception 'event ID collision' using errcode='22023'; end if;
 return 'duplicate'; end if;
 perform 1 from public.profiles where user_id=p_user_id for update;
 if not found then raise exception 'profile missing' using errcode='P0002'; end if;
 v_source := 'revenuecat:'||p_app_id||':'||p_store||':'||p_environment;
 v_tier := case p_product_id when 'intentus_executive_monthly' then 'exec'::public.plan_tier when 'intentus_premium_monthly' then 'premium'::public.plan_tier else 'coach'::public.plan_tier end;
 v_grant := p_event_type in ('INITIAL_PURCHASE','RENEWAL','UNCANCELLATION','SUBSCRIPTION_EXTENDED','TEMPORARY_ENTITLEMENT_GRANT');
 if v_grant then
 if p_expires_at is null or not isfinite(p_expires_at) or p_expires_at <= clock_timestamp() or p_expires_at <= p_event_at then
 raise exception 'future expiration required' using errcode='22023'; end if;
 elsif p_event_type='EXPIRATION' then
 if p_expires_at is null or not isfinite(p_expires_at) or p_expires_at > clock_timestamp() then
 raise exception 'expiration not reached' using errcode='22023'; end if;
 else v_outcome := 'ignored'; end if;
 -- PRODUCT_CHANGE schedules a change: only purchase/renewal establishes paid access.
 select * into v_old from public.rc_entitlement_sources where user_id=p_user_id and source=v_source and product_id=p_product_id;
 if v_outcome <> 'ignored' then
 if v_old.event_at is not null and p_event_at <= v_old.event_at then v_outcome := 'stale';
 elsif not v_grant and v_old.expires_at is not null and p_expires_at < v_old.expires_at then v_outcome := 'stale';
 else
 insert into public.rc_entitlement_sources(user_id,source,product_id,tier,expires_at,event_at,event_id,active)
 values(p_user_id,v_source,p_product_id,v_tier,p_expires_at,p_event_at,p_event_id,v_grant)
 on conflict(user_id,source,product_id) do update set tier=excluded.tier,expires_at=excluded.expires_at,event_at=excluded.event_at,event_id=excluded.event_id,active=excluded.active;
 perform public.recompute_user_plan(p_user_id);
 end if;
 end if;
 insert into public.rc_events(event_id,user_id,app_id,store,environment,product_id,event_type,event_at,expires_at,outcome)
 values(p_event_id,p_user_id,p_app_id,p_store,p_environment,p_product_id,p_event_type,p_event_at,p_expires_at,v_outcome);
 return v_outcome;
end $$;
revoke all on function public.rc_apply_event(text,uuid,text,text,text,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.rc_apply_event(text,uuid,text,text,text,text,text,timestamptz,timestamptz) to service_role;
