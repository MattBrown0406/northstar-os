---
name: Coach system
description: Coach tier ($399/mo) with client management, shareable invite links, audit/report/check-in viewing, plan editing, and white-label branding
type: feature
---
- Coach plan_tier enum value added to plan_tier
- Tables: coach_clients, coach_invite_links, coach_branding (slug, logo, headshot, colors, company_name, tagline)
- Storage bucket: coach-assets (public, scoped by user_id folder)
- Security definer functions: is_coach(), is_client_of()
- RLS: coaches see/edit client data; public can view branding by slug
- White-label: /c/:slug branded login page with coach's logo, headshot, colors, tagline
- Brand color extraction: extract-brand-colors edge function scrapes website for theme-color meta, hex frequency
- Invite flow: invite links (/auth?invite=CODE) OR branded page (/c/:slug) both link client to coach
- invite-user edge function supports coach_name in subject line
- Routes: /coach, /coach/client/:id/report|audit|check-ins, /c/:slug
