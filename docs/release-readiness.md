# Rentalin release readiness

Updated: 2026-10-10

This tracker records evidence for the controlled pilot release plan. A local
build is not a production deployment or a security certification. Draft PRs
must be reviewed and merged by the repository owner. Production deployment
and publication remain owner-approved steps.

## PR queue

| PR | Scope | Status | Depends on | Gate |
| --- | --- | --- | --- | --- |
| PR 01 | Reproducible typechecks, Convex test harness, and CI for all packages | Ready to open as draft | None | Root checks, frontend checks, and both builds pass locally; hosted CI pending PR |
| PR 02 | Backend authorization, role checks, and tenant isolation | Pending | PR 01 | Anonymous, cross-business, inactive-member, and role tests pass |
| PR 03 | Public DTOs, upload access, inquiry abuse controls, and account access | Pending | PR 02 | Public data minimized; upload and public routes verified |
| PR 04 | Reservation availability and date-conflict rules | Pending | PR 02, PR 03 | Boundary, overlap, cancellation, and concurrency tests pass |
| PR 05 | Rental lifecycle, inspection, return, and history | Pending | PR 04 | End-to-end lifecycle and repeat-safe transitions pass |
| PR 06 | Manual payment ledger, truthful reports, receipts, and CSV export | Pending | PR 05 | Ledger, refund, report, and export tests pass |
| PR 07 | Staff administration and pilot UX | Pending | PRs 02–06 | Mobile operator and customer flows pass |
| PR 08 | Release runbook and final evidence report | Pending | PRs 01–07 | All publish-ready gates pass or are explicitly blocked |

As PRs are opened, add their links, branch names, bases, and head SHAs here.
If a PR depends on an unmerged PR, state whether it is stacked and its exact
base branch. Never merge a prerequisite automatically.

## Baseline evidence

Repository was clean at `58bd1471264886d351abfeedbe663b6f444162b1` before
starting this work. One `main` branch was present. This checkout had no
frontend test suite or GitHub Actions workflow at baseline.

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Root `npm ci` | Pass | Completed using npm's explicit `/tmp/rentalin-npm-cache`; installs must be sequential because root cleanup overlaps nested node_modules. Repeated after adding test dependencies. |
| Frontend `npm ci` | Pass | Completed. |
| Landing `npm ci` | Pass | Completed. |
| Frontend `npx tsc --noEmit` | Pass | Before adding the named typecheck script. |
| Frontend `npm run lint` | Pass with warnings | 49 existing warnings, zero errors. |
| Frontend `npm run build` | Pass | Next.js 16.2.12 production build completed. |
| Landing `npm run build` | Pass with telemetry disabled | Astro 5 server build completed. Without disabling telemetry, the environment tried to write `/root/.config/astro`, which is outside the available workspace. CI disables telemetry. |
| Convex strict TypeScript compile | Pass | A direct strict `tsc` invocation over Convex source and generated declarations passed. PR 01 makes this reproducible with a checked-in tsconfig and script. |
| `npm run typecheck` (root) | Pass | Uses checked-in Convex tsconfig; passed after clean root `npm ci`. |
| `npm test` | Pass | `convex-test`/Vitest harness; 2 public inquiry tests pass after clean root `npm ci`. |
| `npx convex dev --once` / codegen | Blocked | No `CONVEX_DEPLOYMENT` is configured. The CLI offered to set up a new project; stopped before creating or linking one. |
| GitHub Actions result | Pending | Workflow will run after PR 01 is pushed/opened. |

PR 01 adds isolated CI jobs for Convex strict typecheck/tests, frontend
typecheck/lint/production build, and landing build. It does not attempt to deploy
or push to a Convex deployment. Backend checking uses the checked-in Convex
source and generated declarations, so it does not replace code generation
against an authorized deployment.

## Publish blockers

- No backend authorization test coverage yet; add with PR 02 using the new harness.
- Unreviewed backend access-control and public-data findings listed in the implementation handoff.
- No booking conflict protection or repeat-safe rental lifecycle verified.
- Revenue is still a placeholder; no payment ledger, invoice, or finance export.
- No automated end-to-end browser test suite.
- No confirmed account-recovery provider, staging deployment, monitoring, backup,
  or restore verification.
- No pilot/customer validation evidence in this repository.

## Restart instructions

1. Fetch current `main`, open PRs, branch heads, and workflow results before
   changing branches. Update this tracker if external state has changed.
2. Read the implementation handoff and applicable `AGENTS.md` files.
3. Continue at the earliest unfinished PR; do not repeat passed checks unless
   relevant files changed.
4. Preserve unrelated work and never reset user changes. Use isolated branches
   and draft PRs.
5. Record exact commands and results. Mark unavailable credentials or services
   as blocked and continue independent work.
6. Leave all merges and production deployment for explicit owner approval.
