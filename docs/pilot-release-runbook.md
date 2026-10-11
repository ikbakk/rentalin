# Rentalin controlled pilot release runbook

This is a preparation checklist, not a deployment authorization. No staging or
production deployment was performed while preparing it. Hosting providers,
domains, monitoring destinations, backup policy, and the applicable data
retention period have not been selected or verified.

## Environments and configuration

Maintain separate Convex deployments and frontend deployments for development,
staging, and production. Never point a staging frontend at production data.
Keep credentials in the hosting provider's secret manager and out of source
control, build logs, screenshots, and test fixtures.

The checked-in code reads these values:

| Variable | Used by | Requirement |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Next.js frontend | The Convex URL for the same environment as the frontend. |
| `CONVEX_SITE_URL` | Convex Auth provider configuration | The matching Convex site URL for the selected deployment. Verify against the deployment settings before signup testing. |
| `NEXT_PUBLIC_FRONTEND_URL` | Settings-generated public links | The canonical app origin for the same environment; use a non-production origin in staging. |
| `PUBLIC_WHATSAPP_NUMBER` | Astro landing demo CTA | Public demo contact in international digits-only format; configure it in `landing/.env`. |

Copy `frontend/.env.example` to `frontend/.env.local` and `landing/.env.example`
to `landing/.env`, then supply the correct values for each runtime. The frontend
has no hidden localhost fallback for Convex connectivity or generated booking
links. Its release preflight fails if required URLs are missing, use HTTP/local
hosts, contain a path or credentials, or pair mismatched Convex deployment
URLs. The landing release preflight requires an 8 to 15 digit international
WhatsApp number without symbols. `NEXT_PUBLIC_*` and `PUBLIC_*` values are
included in client-visible output and must not contain secrets. No provider API
keys are currently required by the codebase. Configure `CONVEX_SITE_URL` in
the Convex deployment environment as well as the frontend build environment;
keep actual values in the relevant local or hosting environment settings.
CI uses isolated placeholders only to exercise the build.

## Pre-deployment gates

1. The implementation PRs are merged. Confirm the current `main` commit and
   its GitHub Actions result before staging.
2. Provision a staging Convex deployment and isolated frontend/landing
   deployments. Copy the environment templates, then seed staging URLs and a
   non-production demo number. Record their origins in the release record; do
   not reuse production credentials or customer data.
3. Set the environment variables above, run `npm run preflight:release` from
   `frontend/`, and verify the frontend's public URLs resolve to staging.
   Configure the password provider and verify sign-up and sign-in. Password
   reset is not implemented because no email provider or recovery flow is
   configured.
4. Run the repository verification commands from the root README. Generate
   Convex code against the authorized staging deployment with
   `npx convex dev --once`. Review schema output and deployment diff before
   any migration or function deployment.
5. Verify the selected host's TLS, domain routing, build command, runtime
   compatibility, environment separation, and rollback mechanism. The repository
   does not identify a supported hosting provider, and its Docker Compose file
   is only a local two-service setup; neither is evidence of production
   readiness.
6. Confirm monitoring, alert routing, backup retention, and a successful
   restore exercise in an isolated environment. These are currently
   unconfigured and block pilot launch.

## Staging smoke test

Use disposable identities, vehicles, customers, and bookings only. Do not use a
real customer's personal data.

1. Create a business account with a 12-character-or-longer password, sign in,
   set the business name and contact phone, add a vehicle, and verify business
   switching and membership roles.
2. Open the public business page without signing in. Submit an inquiry and
   verify malformed dates, unavailable vehicles, and excessive submissions
   fail safely.
3. Sign in as an operator. Review the inquiry, confirm it, prepare the vehicle,
   record and pass a pre-rental inspection, mark it ready, and complete handover
   with an odometer reading. Verify that a pending inspection blocks readiness,
   and that a failed inspection puts the vehicle into maintenance. After repairs,
   verify a repeat inspection can pass without deleting the failed record.
   Confirm a concurrent/overlapping booking is rejected.
4. Record a deposit, a further payment, and a partial refund. Verify the
   outstanding balance, reservation history, daily report, CSV export, and
   formula-safe text handling. A manual record is not proof of a bank transfer.
5. Complete return with a non-decreasing odometer reading. Repeat the return
   request and verify it does not create duplicate history or reset a vehicle
   that has another active constraint.
6. Create an expiring invitation, accept it with the invited account, try it a
   second time and with the wrong email, and confirm the resulting role cannot
   administer staff or business settings. Verify last-owner protection.
7. Open the public tracking link in a signed-out session. Confirm the page
   reveals only the approved tracking fields, uses the business contact number
   for WhatsApp, and that token rotation invalidates the old link.
8. Exercise password reset and account deletion requests. These currently have
   no working user flow; record them as failed release gates until implemented
   and verified.

Record date, commit SHA, environment, operator, command or route, outcome, and
sanitized evidence for each step. Do not put invitation tokens, customer data,
or public bearer URLs in the release record.

## Monitoring and incident response

Before inviting pilot businesses, select an owner for monitoring and configure
the hosting provider's application/build alerts and Convex deployment alerts.
The repository does not currently include error reporting, uptime checks, or
an alert destination. Check authentication failures, Convex function errors,
public inquiry volume, storage use, and unexpected payment/refund activity
daily during the pilot. Do not treat manual payment entries as gateway
settlement.

For suspected tenant data exposure, unauthorized account access, or corrupted
payment history: suspend new invitations and public booking links, preserve
relevant sanitized logs, identify affected environment and records, notify the
business owner through the approved incident channel, and follow the
organization's legal/privacy response process. Those response owners and
notification timelines remain to be assigned.

## Data and recovery

Rentalin stores account email/name, business and staff membership records,
customer names and phone numbers, vehicle and reservation details, inspection
images, and manual payment references/notes. Tracking URLs are bearer links and
must be handled like credentials.

No data-retention schedule, customer deletion request workflow, account
deletion workflow, inspection-image cleanup job, automated backup, or verified
restore procedure is present in the repository. Set retention periods and
deletion responsibilities with the business/privacy owner before collecting
pilot customer data. Do not promise deletion by manually removing a parent
record: related payment history, activity events, inspection files, and storage
objects need a documented, tenant-safe retention/deletion design.

Before a schema or application release, capture the host/provider-supported
backup or export for the target environment and record its identifier. Test
restoration only in an isolated environment. The restore gate remains blocked
until both backup creation and restoration are demonstrated; no live database
mutation was performed for this runbook.

## Rollback

For a frontend-only regression, route traffic back to the last verified
frontend build and keep the currently deployed Convex functions running.
For a Convex function regression, redeploy the last verified backend commit
only after reviewing compatibility with the current schema and data.

All schema changes in the prepared PR queue are additive. Do not delete new
tables or fields as an automatic rollback: invitations, upload claims, activity
events, and ledger rows may already exist. If data was written under the new
schema, prefer a forward fix unless an isolated restore and compatibility
review proves rollback safe. Record the trigger, chosen action, owner, and
verification before reopening pilot traffic.

## Release decision

All eight implementation PRs are merged to `main`, and their hosted CI runs
pass. The pilot is **not ready for launch**. Required blockers are: authorized
staging deployment and desktop/mobile smoke testing, working password recovery,
fully verified tenant-bound upload ownership and cleanup, stronger public
inquiry abuse controls, monitoring and alert ownership, backup/restore exercise,
and approved privacy/retention/deletion behavior. Production deployment remains
subject to the repository owner's explicit approval.
