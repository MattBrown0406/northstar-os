# Intentus: five approved product improvements

## Implemented
1. **Interactive sample before signup** — `/sample`, linked from the mobile-visible landing CTA, and embedded in `/review-demo`. Three progressive questions, Back/edit/reset, answer-sensitive example report and practical next action. Fixed-rule SAMPLE labels; no AI call, no stored answers, no signup requirement. Signup CTA opens the signup form.
2. **Prioritized next action** — Dashboard picks one action from actual saved audit/report/active-goal/weekly-commitment/check-in records. Shows the real goal/commitment context. Supersedes competing audit/report/check-in banners; existing navigation remains.
3. **First-week guide** — Resumable milestones with approximate effort estimates and saved-state completion. Generated report is explicitly not represented as a report the user has read. No fabricated checked boxes or forced deadlines.
4. **Progress story** — Actual report-history comparisons of operating focus/key tradeoff, completed/partial/not-completed/unreported outcomes, check-in counts and one adjustment. Missing baselines are explained. No fabricated improvement score or causal claims.
5. **Coach collaboration controls** — Protected `/sharing`, linked from Settings and Dashboard. Actual linked coach identities and eligibility, explicit category-scope preview, verified saved access state, shared feedback and honest contact expectations. A **single global human-coach sharing switch**, not per-category or per-coach switches. Covers existing and future records for all eligible linked coaches. Existing legacy sharing defaults remain enabled until the user changes them, with explicit notice. Standalone commitments/callbacks, relationship metadata, authorized admin/backend operations and separate AI processing are disclosed accurately. Prior viewed/copied material cannot be recalled.

## Database implementation
`supabase/migrations/20260906014009_sharing_preferences.sql`

Owner-only read/set RPCs; immutable-to-client preference event log; acknowledgement required; NULL auth rejected; no victim ID parameter; existing coach-content RLS helper now checks eligibility and consent. Annotation read/write policy tightened; clients retain access to non-private coach feedback. Errors or unverified readback never claim private/saved state.

**Deploy the migration before enabling the new sharing UI in production.** Missing RPCs produce an unknown-access error rather than false privacy. This work does not resolve the original audit's deployment blockers. No production deployment or native binary submission is included.

## Execution evidence
- Parent full frontend run: 83 tests, 18 test files, all passed.
- TypeScript, ESLint and Vite production build passed. Existing lint warnings remain.
- 35 sharing pgTAP assertions passed in two isolated local databases, including integration with the preceding repair migrations. All seven SQL test files completed successfully in the combined local schema. This is not original CLI clean-history acceptance.
- Public sample browser checks: 17/17 assertions at 320px and 390px, including edits, answer retention, signup mode, no sample persistence and protected sharing route.
- Authenticated-screen browser checks use explicitly mocked backend fixtures (not live account data): dashboard/guide rendering, narrow layout, sharing off/readback, injected save failure and no false success.
- Independent features 1–4 SPEC and QUALITY reviews approved; independent sharing SPEC/SECURITY and QUALITY reviews approved. Parent reproduced decisive tests.

## Deployment hold
Matt authorized pushing the verified source to main. This does not authorize automatic production migration, app deployment or native submission. Historical duplicate migration versions, payment lifecycle/configuration work, hosted egress/device checks and account-deletion lifecycle limitations remain documented in `docs/audit-status.md`.
