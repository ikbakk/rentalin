# Rentalin controlled pilot release runbook

Updated 2026-10-23. Read [deployment setup](deployment.md) for current environment,
R2, recovery, Turnstile, monitoring and backup configuration. Read
[release readiness](release-readiness.md) for verified checks and remaining gates.
The following operational procedure is retained; this is not deployment evidence.

## Environments and configuration

Maintain separate Convex deployments and frontend deployments for development,
staging, and production. Never point a staging frontend at production data.
Keep credentials in the hosting provider's secret manager and out of source
control, build logs, screenshots, and test fixtures.

Use the root, frontend and landing `.env.example` files and the environment
matrix in `deployment.md`. Server credentials belong in Convex, public values
belong at each frontend's build time, and `SENTRY_DSN` is a Next.js runtime value.
Run all three preflights after supplying values for the selected environment.

## Pre-deployment gates

1. The implementation PRs are merged. Confirm the current `main` commit and
   its GitHub Actions result before staging.
2. Provision a staging Convex deployment and isolated frontend/landing
   deployments. Copy the environment templates, then seed staging URLs and a
   non-production demo number. Record their origins in the release record; do
   not reuse production credentials or customer data.
3. Set the environment variables above, run `npm run preflight:release` from
   `frontend/`, and verify the frontend's public URLs resolve to staging.
   Configure the password provider and verify sign-up and sign-in. Password reset is implemented, but its Resend sender/key and actual
   delivery must be configured and verified.
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
8. Exercise password reset and account deletion requests. Password recovery has a code-based flow that needs a live
   delivery test; deletion requests follow the owner-reviewed contact procedure
   in `deployment.md`. Self-service deletion is not implemented.

Record date, commit SHA, environment, operator, command or route, outcome, and
sanitized evidence for each step. Do not put invitation tokens, customer data,
or public bearer URLs in the release record.

## Monitoring and incident response

Before inviting pilot businesses, select an owner for monitoring and configure
the hosting provider's application/build alerts and Convex deployment alerts.
The repository includes optional privacy-filtered Sentry error capture and a
readiness endpoint. Configure an external uptime monitor and alert destination. Check authentication failures, Convex function errors,
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

A cleanup cron and R2 staging lifecycle handle abandoned uploads. Attached
evidence and customer/account records still need an owner-approved retention
and deletion policy. Never delete a parent record alone: related ledger,
activity, inspections and objects must be reviewed together. Backup tooling is
in `scripts/backup.mjs`; no live restore test or recurring schedule has been
configured by this change.

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

The application builds and its fixture checks pass. Deployment validation still
requires real service configuration, isolated browser/mobile tests, actual reset
email and R2 tests, monitoring delivery and backup/restore evidence. Keep public
launch gated on these checks and approval of privacy/retention procedures.
