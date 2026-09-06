# Intentus five product improvements Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Deliver all five approved improvements without production deployment.

**Architecture:** Isolated React components with real account data; deterministic sample stays separate from production records. Coach sharing is enforced by database predicates and RPCs, not UI-only preferences.

**Tech Stack:** React, TypeScript, Vite, Supabase SQL/RLS, Vitest.

## Task 1: Interactive sample
Create src/components/InteractiveSample.tsx and src/test/sample-experience.test.tsx. Add three progressive questions, back/edit support, deterministic labeled sample report and signup CTA. No network or private browser persistence. Mount in AppReviewDemo and landing page. Test answer gating, changing answers and reset using Vitest.

## Task 2: Prioritized next action and first-week path
Create src/components/dashboard/GettingStarted.tsx and src/lib/getting-started.ts. Read actual account audit/report/goals/commitments/check-in state, error-first retry UI. Produce one action ordered audit -> goal -> commitment -> check-in, not generic competing CTAs. Guide displays persisted completed steps and honest estimates; no fake completion. Test pure decisions and loading/error/account transitions.

## Task 3: Progress story
Create src/components/dashboard/ProgressStory.tsx and src/lib/progress-story.ts. Read actual audit_history snapshots and recent check-ins/commitments. Compare stable measurable fields only, explain no causation inference, show missing-baseline state and one actionable adjustment. Test sparse/null data, chronology and partial completion.

## Task 4: Coach sharing backend
Inspect all final policies/helper callers. Add CLI-generated migration for per-client sharing preferences default preserving legacy access with explicit notice; users can revoke per audited category; enforcement must cover all coach SELECT paths and service endpoints. Owner-only settings writes, client row identity immutable, coaches cannot expand grants. Test local real RLS including existing membership/admin semantics. No production migration.

## Task 5: Coach collaboration UI
Create dedicated /sharing page routed under ProtectedRoute, expose effective linked coach visibility/settings with saved/error state and retry. No link defaults to private; database failure never claims private/saved. Explain existing disclosure cannot be recalled; distinguish AI coach and human coach; no invented response-time promise.

## Integration and acceptance
Mount components with stable account keys; link sharing from Settings and dashboard. Run npm test, lint, tsc, build, Deno checks/tests and browser mobile sample/route checks. Review code independently. Keep original audit deployment holds. Commit/push isolated branch, read back SHA, verify CI. Report implemented vs unverified deployment separately.
