# Rentalin deployment setup

Implementation branch builds on the environment work in PRs #13–#15. Nothing in
this document provisions infrastructure or authorizes a merge/deployment.

## Environment files and where the values go

| Example | Local copy | Hosting destination |
| --- | --- | --- |
| `.env.example` | `.env.local` | Backend values go in the selected **Convex deployment** settings; public Compose values belong on the build host |
| `frontend/.env.example` | `frontend/.env.local` | Next.js project build/runtime environment |
| `landing/.env.example` | `landing/.env` | Astro project build environment |

Do not commit populated files. Never prefix R2 credentials, email credentials,
or auth signing keys with `NEXT_PUBLIC_` or `PUBLIC_`. Copying a local env file
**does not** populate hosted Convex environment variables. `CONVEX_SITE_URL` is
provided automatically inside Convex; the frontend preflight also needs its
public value to check that the two deployment URLs match.

Use independent Convex deployments and R2 buckets for staging/production. Set
`SITE_URL` to the app origin in Convex. Configure Convex Auth's matching
`JWT_PRIVATE_KEY` and `JWKS` for a new deployment using its setup instructions:
https://labs.convex.dev/auth/setup/manual . Preserve existing signing keys.
The root example deliberately leaves credentials empty.

For locally held backend values:

```sh
RENTALIN_ENV_FILE=.env.local npm run preflight:backend
```

This checks values, not connectivity or delivery. Do not print real env files,
keys, reset codes, signed URLs, invitation codes or booking tokens in reports.

## R2 private images

1. Create an R2 bucket and keep both `r2.dev` and custom-domain public access
   disabled. Inspection evidence must remain private.
2. Create an Object Read & Write API token scoped to this bucket. Put
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
   in the Convex deployment environment.
3. Adapt `ops/r2-cors.example.json` with the exact app origins for that
   environment and apply it in the bucket's CORS settings. Do not use `*`.
4. Configure a one-day expiration rule for **only `staging/`**, with
   `ops/r2-lifecycle.example.json` as the S3-compatible example. This rule
   removes replays of an upload URL after its database record is deleted.
   Never add automatic expiration to `inspections/`.
5. Backend reserves tenant/user-bound keys before signing a five-minute PUT.
   It checks the uploaded size, MIME and image signature, downloads using the
   checked ETag, and writes those validated bytes to the final key. No PUT
   URL for that final key is ever issued to the browser.
6. Unattached records expire after 24 hours and are cleaned hourly. Failed
   removals remain in `deleting` for retry. Attached inspection evidence is
   retained until an owner-reviewed deletion is approved. Signed read links
   last five minutes; the UI refreshes them. Membership revocation prevents
   new signed reads; an already issued URL can work until its expiry.

New uploads use R2. Existing attached Convex files remain readable and existing
pending claims can be removed. New first-claim Convex upload issuance is disabled.
No live file migration, bucket creation or object deletion has been performed.
Vehicle photos are still placeholders; this change implements the existing
inspection-photo feature rather than introducing another upload feature.

## Recovery email and public inquiries

Configure a verified Resend sender domain, set `AUTH_RESEND_KEY` and
`AUTH_EMAIL_FROM` in Convex, then test an actual reset email. The recovery UI
accepts the 12-character email code, which expires after 15 minutes, and a new
password of at least 12 characters. Convex Auth handles code verification,
credential replacement and revocation of other sessions. Delivery credentials
are backend-only. A generic request message avoids revealing account existence
through the UI. There is no email-invitation sender; invitations still use codes.

Create a Cloudflare Turnstile widget for the app hostname. Set its public site
key as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` **before building** the frontend, and its
secret key plus exact `TURNSTILE_EXPECTED_HOSTNAME` in Convex. The server checks
both hostname and action `rental-inquiry`. Only an internal mutation can write
inquiries after verification. Missing verification configuration fails closed.
After verification, limits are enforced transactionally: three inquiries per
phone per business per rolling hour and sixty per business per clock hour.
Turnstile tokens are single-use; the UI obtains a fresh token after each submit.
Provider/edge-level volume controls can still be configured separately.

## Landing, application and container builds

`PUBLIC_APP_URL` is the Next.js origin. Landing's Staff Login links to that
origin's `/login`, even when Astro is hosted separately. Set the real demo
contact in `PUBLIC_WHATSAPP_NUMBER`. Next.js `/` redirects to `/operations`.
The existing Astro Node adapter requires a compatible Node host; choose a host-
specific adapter before deploying SSR Astro to a different runtime.

Install root dependencies first, then frontend, then landing; do not run root
`npm ci` after installing nested packages. For a frontend host with a project
root of `frontend`, its install command must install the shared root dependencies
as well (`cd .. && npm ci && cd frontend && npm ci`). Build with `npm run build`
and start with `npm start`. The landing project uses its own install/build/start.

The Docker frontend context is now the repository root, so shared Convex imports
exist during typechecking and bundling. `docker compose --env-file .env.local build`
passes public build values; R2 and email secrets belong to Convex, not Docker.
Container execution still needs to be tested on a Docker-enabled host.

## Monitoring and backups

- `/api/health` returns HTTP 200 only when Next can reach the Convex readiness
  query and the required backend env values are present. Otherwise it returns
  503 without exposing configuration values. This checks connectivity and
  configuration presence, not R2 authentication or email delivery.
- Optional `NEXT_PUBLIC_SENTRY_DSN` and server runtime `SENTRY_DSN` enable Sentry
  error capture. Requests, bodies, users, breadcrumbs, arbitrary messages and
  local variables are excluded; error frames are retained. Tracing and session
  replay are not configured. Source-map upload is not configured. Set alert
  recipients and test delivery in Sentry before treating it as operational.
- Configure an external uptime monitor for `/api/health`, and alerts for Convex
  function errors, cron failures, inquiry volume and storage growth. Look for
  `r2_cleanup_failed` or `r2_staging_cleanup_deferred` without logging object URLs.
- Schedule Convex backups in the provider dashboard where supported. For a
  portable snapshot of Convex **and** R2, run with explicit source selection:

```sh
RENTALIN_ENV_FILE=.env.local node scripts/backup.mjs --deployment YOUR_DEPLOYMENT --output backups/2026-10-23-test
node scripts/backup.mjs --verify backups/2026-10-23-test
```

The script exports Convex (including legacy file storage), downloads final R2
objects, and verifies a SHA-256 manifest. It refuses an existing output directory.
R2 is not included in a Convex-only export. Snapshot folders contain customer
and auth data: encrypt them and copy off-host to a restricted destination. A
local checksum pass is not a restore test or a configured recurring backup.

Restore exercise: verify checksums; provision an isolated Convex deployment
and an isolated private R2 bucket; import `convex.zip` into that deployment using
Convex's documented import command with the **explicit isolated target**; upload
`files/` to that bucket preserving the original keys; set the restored backend's
R2 bucket/credentials, auth keys and app origin; deploy the matching code; then
verify login, tenant isolation, record counts, ledger balances and inspection
photo reads. Never restore into production as an exercise. Record the snapshot,
commit, targets and results. The repository tests checksum corruption and path
validation; no remote backup or restore has yet been performed.

## Privacy and remaining launch checks

Keep abandoned photos for at most the 24-hour cleanup window (R2 staging
lifecycle is the backstop). Do not guess retention periods for attached evidence,
financial history or account data. Until the owner approves that policy, accept
customer/account deletion requests through the business's published contact,
verify the requester, record the scope and related records, and have the owner
review retention obligations before a tenant-scoped deletion. There is no
self-service deletion feature and no automatic cascade deletion.

Before real customers: configure real services, run isolated desktop/mobile
flows (including reset delivery, expired/replayed PUT, cross-tenant file reads,
Turnstile failure and backup restore), verify monitoring recipients and agree
retention/deletion procedures. Build success alone does not complete these gates.
