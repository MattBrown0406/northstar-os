---
name: Coach system
description: Coach tier ($399/mo) with client management, shareable invite links, audit/report/check-in viewing, and plan editing
type: feature
---
- Coach plan_tier enum value added to plan_tier
- Tables: coach_clients (coach_user_id, client_user_id, assigned_tier), coach_invite_links (coach_user_id, invite_code, assigned_tier, label, is_active, uses_count)
- Security definer functions: is_coach(), is_client_of() — used in RLS policies on baseline_audits, strategic_reports, check_ins, profiles
- Coaches get full control: view audits, view/edit reports (north_star, forced_choice, 90-day plan), view check-ins
- Coaches assign clients to free/pro/premium tiers
- Invite flow: coach creates link → shares URL with ?invite=CODE → client signs up → process-coach-invite edge function links them
- Routes: /coach, /coach/client/:clientId/report, /coach/client/:clientId/audit, /coach/client/:clientId/check-ins
- Dashboard shows "Coach Portal" button when plan_tier === 'coach'
