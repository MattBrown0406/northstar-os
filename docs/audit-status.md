# Intentus repair audit — local checkpoint, NOT a production release

## Implemented
- Repaired npm clean-install lockfile and upgraded vulnerable dependencies.
- Auth restoration/account-switch fencing; safe continuation URLs; native cold-link recovery and listener cleanup; push-token cleanup before sign-out; visible logout failure.
- Removed client-authoritative subscription grants; fenced native billing identity; separate Android configuration; pending verification messages.
- Audits/reports/coaching/goals: checked persistence results, serialized writes, retained failed drafts, stable history retries, local-calendar handling and consecutive-week calculations.
- Atomic database check-in/re-audit and coach invitation workflows; ownership/tier enforcement, RLS hardening and source-aware entitlement aggregation.
- Auth/public-data deletion transaction and checked, bounded coach-assets cleanup before Auth deletion. Storage cleanup itself cannot roll back.
- Bounded AI request bodies/deadlines and DNS-pinned brand extraction.
- Mobile demo overflow and landing menu accessibility; guarded lazy-route recovery when browser storage throws.

## Verified locally
- Clean npm ci succeeds; npm audit reports zero known vulnerabilities at verification time.
- 56 frontend tests pass; TypeScript passes; production Vite build passes.
- ESLint exits zero, with 23 warnings (not a warning-free claim).
- Public/mobile browser smoke: 30 route/viewport visits, 95/95 assertions; zero uncaught page errors. External networking blocked; this is NOT an authenticated live-backend or device test.
- All Edge Function/shared-module Deno checks pass. Deno helper/handler tests executed with deterministic doubles, not real payment providers.
- SQL suites executed on dedicated local Supabase PostgreSQL, including real role/RLS/transaction tests for security, check-in/re-audit, RC, Square and deletion. See remaining runtime caveat below.

## Unresolved — do not deploy this branch as-is
1. Two original migration filenames share prefix `20260412`. Reconcile against authoritative production applied-history before renaming/removing anything. SQL-content replay is not original CLI reset acceptance.
2. Square refunds/disputes still return retryable 503; resubscription lifecycle and periodic expiration/provider reconciliation need completion and provider Sandbox tests. Required merchant/catalog/webhook mappings must be supplied. RC requires authoritative app/store/product/environment configuration and legacy-grant reconciliation. No real purchase lifecycle was certified.
3. Hosted Edge Runtime support for raw DNS-pinned TLS egress is unverified; extraction fails closed where unavailable.
4. Account deletion cleans coach-assets, but concurrent new uploads and other-bucket ownership require a durable deletion-pending workflow. Real GoTrue/Storage integration remains unverified.
5. Local all-SQL verification required current auth helper definitions from another isolated Intentus schema because interrupted CLI startup left outdated Auth helpers. Initial ownership-transfer migration failure was repaired with temporary, restored schema privileges. A direct authenticated call to a non-executable coach RPC crashed this local PostgreSQL runtime; the catalog correctly denies EXECUTE, but an expected permission-error runtime result was NOT verified. Investigate platform/runtime before claiming release acceptance. Catalog pgTAP checks do not replace this missing negative runtime gate.
6. Physical-device purchase/restore, push delivery, native recovery and authenticated browser workflows remain unverified. No production migrations, functions, app builds or deployments performed.

## Five product improvements recommended, not implemented
1. Interactive sample audit and report before signup: demonstrate the actual reasoning and next action rather than only listing features in review-demo.
2. A single prioritized next-action card connecting North Star goal, plan commitment and next check-in; reduce choosing between separate dashboards/tools.
3. A first-week guided path with transparent time estimates and resumable steps from audit to first completed action.
4. A progress story comparing prior audits and weekly follow-through, with understandable explanations of changes and one suggested adjustment—not just scores/streaks.
5. Clear coach collaboration controls: preview exactly what the coach sees, choose what to share, and make feedback/next-contact expectations explicit.

These recommendations are hypotheses to test, not guaranteed retention or conversion gains.
