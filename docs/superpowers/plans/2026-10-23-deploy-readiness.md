# Rentalin deployment readiness implementation plan

Execution: implement directly in this session, as requested by the user.

**Goal:** Prepare private R2 upload and release integrations with documented environment configuration.
**Architecture:** Convex authorizes and records files; server-only R2 actions sign staging uploads, verify and promote objects, sign reads and clean abandoned objects. Existing environment PRs are the branch base.
**Tech stack:** Convex, AWS S3 SDK for R2, Next.js, Astro, Convex Auth, Resend and Turnstile.
**Spec:** docs/superpowers/specs/2026-10-23-deploy-readiness.md

## Constraints and review focus

- No merge, live deployment, external email or production-data mutation.
- Keep credentials server-side; preserve legacy records.
- Check foreign tenant/user access, replayed upload URLs, cleanup/attachment races, revoked memberships and missing external configuration.

## Tasks

- [x] Add failing tests for R2 ownership, attachment states, immutable finalization and cleanup; implement metadata mutations and server-only storage actions; wire upload and private photo display.
- [x] Add recovery provider and login reset flow, with delivery/configuration tests.
- [x] Require verified Turnstile on public inquiries and retain atomic throttling; test invalid/missing verification and distributed phone abuse.
- [x] Configure landing app-origin links; test URLs and run frontend/landing checks.
- [x] Document env placement, R2 CORS/lifecycle, deployment order, monitoring and backup/restore; add operational scripts and verify safe failure without secrets.
- [x] Review diff, run all available checks, publish a reviewable PR and record live-service limitations.

Implementation and fixture verification complete. Live integration configuration, restore exercise, Docker runtime and customer-data retention policy remain explicitly documented launch gates.
