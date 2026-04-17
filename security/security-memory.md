# Security Memory

This document records intentional security postures so future scans don't
re-flag them as vulnerabilities. Co-maintained by the Lovable agent and the
project owner. Keep entries fresh — remove when posture changes.

## Intentional postures

### Public listing on the `coach-assets` storage bucket
- **Linter rule:** `0025_public_bucket_allows_listing`
- **Status:** Accepted / intentional.
- **Why:** The `coach-assets` bucket serves public branding content
  (logos, headshots, marketing imagery) that is rendered on public branded
  auth pages and marketing surfaces via `getPublicUrl()`. The files are
  world-readable by design.
- **Trade-off considered:** Making the bucket private would require switching
  every public surface (branded auth, public coach landing pages) to signed
  URLs, which would add latency, complicate caching, and break the explicit
  "public branding" model.
- **Mitigations in place:** Write/update/delete policies are scoped to
  `(storage.foldername(name))[1] = auth.uid()::text`, so coaches can only
  modify their own folder. The risk is limited to enumeration of public
  branding assets, which carry no sensitive data.
- **Re-evaluate if:** the bucket starts being used for non-branding content,
  user-uploaded private files, or anything that should not be world-readable.

## Auth posture

- **Leaked-password protection (HIBP):** ENABLED.
- **Auto-confirm email signups:** DISABLED — users must verify email before
  signing in.
- **Anonymous signups:** DISABLED.
