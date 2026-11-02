# Rentalin release readiness

Updated: 2026-10-23

The implementation PRs #5–#12 are merged into `main`. Follow-up PRs #13–#15
remain open; this implementation builds on #15, without merging or deploying.
See [deployment setup](deployment.md) for the environment matrix and run commands.

## Prepared in code

| Area | State |
| --- | --- |
| Tenant authorization, roles, reservations, inspections, rental lifecycle, manual ledger | Existing implementation merged; covered by regression tests |
| Runtime environment examples and preflight | Existing #14–#15 work carried forward; root/backend, frontend and landing examples now document service configuration |
| Private inspection uploads | R2 upload intent recorded before signing; validated staging bytes promoted to final keys; five-minute signed reads; hourly abandoned-upload cleanup; legacy new claims disabled |
| Recovery | Convex Auth email code reset provider via Resend and frontend reset forms; real delivery configuration required |
| Inquiry abuse control | Server-verified Turnstile hostname/action, internal-only write path, transactional phone/business limits |
| Routing | Configurable absolute landing login URL; app root redirects to operations; shared root dependencies included in frontend container build |
| Monitoring | Readiness endpoint and optional privacy-filtered Sentry capture; external monitor and alert recipients still need configuration |
| Backup | Explicit-source Convex+R2 export script and checksum verification; recurring schedule, off-host encryption and isolated restore still required |

## Verification

- Backend typecheck passes; 14 test files / 64 tests pass.
- Frontend typecheck and default Turbopack production build pass.
- Frontend lint has zero errors and 34 warnings (existing unused imports,
  existing icon alt-text warning, and image/performance warnings).
- Frontend release-env/public-env tests and error-event privacy checks pass.
- Landing configuration tests and production build pass.
- Backend env validation and backup checksum/path tests pass.
- Local production-server browser smoke passes mobile reset/signup form navigation,
  the configured absolute landing login link, and health HTTP 503 with an
  unconfigured backend. This does not exercise authentication or live services.
- Builds use isolated placeholder origins and Turnstile site key, not live
  credentials. No real email, R2 object or public inquiry was sent.
- `npx convex codegen --typecheck enable` is blocked because no
  `CONVEX_DEPLOYMENT` is configured; no project was created or linked. The
  checked-in API declarations include the new modules; regenerate against
  the selected isolated deployment before release.
- Docker is not available here. The container build context was corrected,
  but the image/Compose runtime has not been exercised.

## Remaining gates before accepting customers

1. Review and merge the code in dependency order after approval; verify CI for
   the exact integrated commit.
2. Select hosting and configure isolated environments, Convex Auth keys,
   Resend sender, private R2 CORS/lifecycle and real Turnstile keys. Env templates
   are instructions, not evidence that services have been configured.
3. Verify desktop/mobile flows with disposable accounts, including revoked
   staff access, image verification/replay/expiry, unavailable dates,
   inspection failure/recheck, handover/return repeats, payments/refunds,
   invitations, tracking token rotation and actual password reset delivery.
4. Configure alert recipients and uptime checks; verify an alert reaches the
   responsible operator. Monitor Convex errors and R2 cleanup independently.
5. Take and restore a real Convex+R2 snapshot in isolated targets and record
   checksums, record counts, financial balances and photo retrieval results.
6. Approve retention periods and the owner-reviewed customer/account deletion
   procedure. Self-service deletion is not implemented; no financial or
   inspection evidence is automatically cascaded away.

## Scope and limitations

Manual ledger entries do not verify bank settlement. Staff invitations are
shared codes, not delivered emails. New R2 uploads cover inspection evidence;
vehicle-image placeholders are unchanged. Existing attached legacy files remain
readable; no live migration was attempted. Signed file URLs are bearer links
until their five-minute expiry. Turnstile is not a substitute for provider/edge
volume protection. Tests use fixtures and provider I/O stubs where necessary,
not live cloud services. The application is prepared for deployment validation,
**not yet verified for a public launch**.
