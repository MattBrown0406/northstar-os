create table public.square_checkouts (
 id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 merchant_id text not null, location_id text not null, variation_id text not null,
 order_id text unique, payment_link_id text unique, checkout_url text,
 subscription_id text unique, created_at timestamptz not null default now(),
 event_at timestamptz, event_id text,
 unique(user_id,merchant_id,location_id,variation_id)
);
create table public.square_events(event_id text primary key,checkout_id text not null references public.square_checkouts(id) on delete cascade, received_at timestamptz not null default now());
alter table public.square_checkouts enable row level security;
alter table public.square_events enable row level security;
revoke all on public.square_checkouts,public.square_events from public,anon,authenticated;
grant select,insert,update,delete on public.square_checkouts,public.square_events to service_role;
create function public.square_apply_state(p_checkout_id text,p_subscription_id text,p_event_id text,p_event_at timestamptz,p_active boolean,p_expires_at timestamptz)
returns text language plpgsql security invoker set search_path='' as $$
declare b public.square_checkouts%rowtype; prior text;
begin
 if current_user <> 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 if p_event_id is null or length(p_event_id) not between 1 and 200 or p_subscription_id is null or p_event_at is null or not isfinite(p_event_at) or p_event_at > now()+interval '5 minutes' then raise exception 'invalid event'; end if;
 if p_active is null or (p_active and (p_expires_at is null or not isfinite(p_expires_at) or p_expires_at <= now())) then raise exception 'invalid expiration'; end if;
 perform pg_advisory_xact_lock(hashtextextended('square:'||p_event_id,0));
 select checkout_id into prior from public.square_events where event_id=p_event_id;
 if found then
  if prior <> p_checkout_id then raise exception 'event collision'; end if;
  return 'duplicate';
 end if;
 select * into b from public.square_checkouts where id=p_checkout_id for update;
 if not found or b.order_id is null then raise exception 'checkout missing'; end if;
 if b.subscription_id is not null and b.subscription_id <> p_subscription_id then raise exception 'subscription collision'; end if;
 perform 1 from public.profiles where user_id=b.user_id for update;
 insert into public.square_events(event_id,checkout_id) values(p_event_id,p_checkout_id);
 if b.event_at is not null and p_event_at <= b.event_at then return 'stale'; end if;
 update public.square_checkouts set subscription_id=p_subscription_id,event_at=p_event_at,event_id=p_event_id where id=b.id;
 insert into public.rc_entitlement_sources(user_id,source,product_id,tier,expires_at,event_at,event_id,active)
 values(b.user_id,'square:'||b.merchant_id||':'||p_subscription_id,b.variation_id,'coach',p_expires_at,p_event_at,p_event_id,p_active)
 on conflict(user_id,source,product_id) do update set expires_at=excluded.expires_at,event_at=excluded.event_at,event_id=excluded.event_id,active=excluded.active;
 perform public.recompute_user_plan(b.user_id);
 return 'applied';
end $$;
revoke all on function public.square_apply_state(text,text,text,timestamptz,boolean,timestamptz) from public,anon,authenticated;
grant execute on function public.square_apply_state(text,text,text,timestamptz,boolean,timestamptz) to service_role;
