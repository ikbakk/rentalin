# Rentalin release readiness

Updated: 2026-10-11

This tracker records evidence for a controlled pilot. Passing local builds does
not mean the code is reviewed, deployed, or ready to collect customer data.
The implementation is published as seven open draft pull requests, with the
release runbook and this tracker prepared as PR 08. No change has been merged,
and no production data or deployment has been touched.

## Focused PR queue

The exact local base/head chain is:

| PR | Scope | Branch | Base branch (SHA) | Hosted head SHA | State |
| --- | --- | --- | --- | --- | --- |
| 01 | Reproducible checks, Convex test harness, CI | `chore/ci-release-readiness` | `main` (`58bd1471264886d351abfeedbe663b6f444162b1`) | `ac2836a137bb966b5f9944df97ef0922e8551b9e` | [Draft PR #5](https://github.com/ikbakk/rentalin/pull/5); hosted CI pass |
| 02 | Tenant authorization, roles, ownership, revoked membership | `fix/tenant-authorization` | `chore/ci-release-readiness` (`ac2836a137bb966b5f9944df97ef0922e8551b9e`) | `f2c8d720cdead5a05257eed36d6f33609b821d19` | [Draft PR #6](https://github.com/ikbakk/rentalin/pull/6); hosted CI pass |
| 03 | Public DTOs, tracking token controls, inquiry validation, scoped uploads | `fix/public-data-upload-controls` | `fix/tenant-authorization` (`f2c8d720cdead5a05257eed36d6f33609b821d19`) | `2c6a6f44e536e0ea66b50323d4251c478d6b17a9` | [Draft PR #7](https://github.com/ikbakk/rentalin/pull/7); hosted CI pass; security limitations below |
| 04 | Canonical booking intervals and transactional availability rules | `fix/reservation-availability-rules` | `fix/public-data-upload-controls` (`2c6a6f44e536e0ea66b50323d4251c478d6b17a9`) | `0aa18c96e45d5d060fd6ae81f2513a58aab84cc8` | [Draft PR #8](https://github.com/ikbakk/rentalin/pull/8); hosted CI pass |
| 05 | Repeat-safe rental lifecycle, odometers, and activity history | `fix/repeat-safe-rental-lifecycle` | `fix/reservation-availability-rules` (`0aa18c96e45d5d060fd6ae81f2513a58aab84cc8`) | `bda9f69c81e44688d675644ec661221bc902a33e` | [Draft PR #9](https://github.com/ikbakk/rentalin/pull/9); hosted CI pass |
| 06 | Append-only manual payment ledger, reports, receipts, CSV | `feat/manual-payment-ledger` | `fix/repeat-safe-rental-lifecycle` (`bda9f69c81e44688d675644ec661221bc902a33e`) | `8285afa9fb2293669edda80feb587dd147eb6219` | [Draft PR #10](https://github.com/ikbakk/rentalin/pull/10); hosted CI pass |
| 07 | Staff invitations, operator workflow, inspection/handover, business time zone, public contact links | `feat/pilot-ux-staff-admin` | `feat/manual-payment-ledger` (`8285afa9fb2293669edda80feb587dd147eb6219`) | `5764c4ee3bf35587ce8f73ec02ffdfcc36012a27` | [Draft PR #11](https://github.com/ikbakk/rentalin/pull/11); hosted CI pass; browser/mobile staging gate blocked |
| 08 | Pilot runbook and readiness evidence | `docs/pilot-release-runbook` | `feat/pilot-ux-staff-admin` (`5764c4ee3bf35587ce8f73ec02ffdfcc36012a27`) | Branch tip including this tracker update | [Draft PR #12](https://github.com/ikbakk/rentalin/pull/12); hosted CI pass |

PR 02–08 are deliberately stacked. PRs 01–08 are open as drafts in dependency
order. Hosted GitHub Actions results have not yet been verified. Copy-ready
titles and bodies are in `docs/pr-drafts/` and use the hosted head SHAs.

## Verification evidence

| Check | Latest result | Evidence / limitation |
| --- | --- | --- |
| Root Convex TypeScript check | Pass | `npm run typecheck` on PR 07 |
| Convex tests | Pass | `npm test -- --reporter=dot`: 9 files, 42 tests, including timezone, inspection/handover, upload cleanup, finance and authorization cases |
| Convex Auth JavaScript syntax | Pass | `node --check convex/auth.js`; signup requires 12 characters |
| Frontend TypeScript check | Pass | `cd frontend && npm run typecheck`; run after the production build to avoid concurrent `.next/types` regeneration |
| Frontend lint | Pass with warnings | `cd frontend && npm run lint`: 36 warnings, zero errors; baseline was 49 |
| Frontend production build | Pass with sandbox workaround | `cd frontend && npm run build -- --webpack`; Next.js 16.2.12. Default Turbopack build cannot create a worker process in this sandbox (`Operation not permitted`); Webpack production build completed. CI must verify the configured default build outside this sandbox. |
| Landing production build | Pass | `ASTRO_TELEMETRY_DISABLED=1 npm run build` in `landing/`, verified in PR 01; landing unchanged since |
| Diff whitespace check | Pass | `git diff --check` before PR 07 commit |
| Convex generation/deployment check | Blocked | No `CONVEX_DEPLOYMENT` configured. CLI offered project setup; stopped without linking/creating a deployment. |
| GitHub Actions | Pass, 8/8 | PRs #5–#12 pass Convex typecheck/tests, frontend typecheck/lint/build, and landing build. Runs: [#5](https://github.com/ikbakk/rentalin/actions/runs/38116981901), [#6](https://github.com/ikbakk/rentalin/actions/runs/38117088605), [#7](https://github.com/ikbakk/rentalin/actions/runs/38117114594), [#8](https://github.com/ikbakk/rentalin/actions/runs/38117137618), [#9](https://github.com/ikbakk/rentalin/actions/runs/38117159879), [#10](https://github.com/ikbakk/rentalin/actions/runs/38117189167), [#11](https://github.com/ikbakk/rentalin/actions/runs/38117215620), [#12](https://github.com/ikbakk/rentalin/actions/runs/38117377401). The first PR #5 run exposed missing root Convex dependencies and a `main`-only PR trigger; the workflow now covers stacked PRs and its rerun passes. |
| Full browser/mobile E2E | Blocked | No isolated staging deployment or browser test suite is configured. |
| Current GitHub PR state | 8 open drafts | PRs #5–#12 were created on 2026-10-11; none is merged. Hosted checks are pending verification. |
| PR publication | Pass for PRs 01–08 | The GitHub integration created the stacked branches and draft PRs. |

Install commands were run sequentially; root `npm ci` removes nested
`node_modules`. The root and frontend emitted npm's existing
`http-proxy` configuration warning; it did not affect exit status.

## Security and product limitations

- Upload issuance and attachment require authenticated tenant access, and
  server-side type/size checks exist. Convex's standard upload response does not
  cryptographically bind a storage ID to the caller/tenant. First-claim
  ownership still needs validation against the supported storage flow. The UI
  can delete explicitly removed pending photos, but abandoned/rejected uploads
  may remain; add and verify a retention cleanup path before launch. Treat
  upload ownership as a release blocker until verified tenant binding is proven.
- Public inquiry validation includes bounded inputs, availability checks, and
  a per-business phone-based throttle. It does not provide robust IP-based
  abuse protection, CAPTCHA, or edge-level rate limiting. Treat this as a
  pilot blocker until acceptable abuse controls are configured and tested.
- Password sign-up and sign-in are configured; reset/recovery is not. There is
  no email sender/provider or recovery UI. Do not claim account recovery works.
- Staff invitations are owner-created, business-scoped, email-bound,
  single-use, and expire after 24 hours. Rentalin shows a code for the owner to
  share; it does not send email.
- Public tracking is a bearer link. Responses are minimized and token rotation
  is available, but anyone holding the active URL can access its allowed fields.
- Payment records are manual operator entries. They do not verify bank
  settlement or gateway transactions.
- No privacy retention schedule, account/customer deletion workflow, automated
  inspection storage cleanup, error reporting, uptime check, alert destination,
  automated backup, or restore test exists yet.
- No real customer/pilot validation has been run. Local tests are not a
  penetration test or a staging smoke test. The full UI workflow is now wired
  through reservation, inspection, handover and return, and the backend gates
  inspection completion before handover; it has not been exercised in a real
  browser on mobile or staging.

## Release decision

**Not ready to launch or deploy.** The stacked draft PRs are open and require
review and hosted CI. Password
recovery, fully verified tenant-bound uploads and storage cleanup, stronger
public inquiry abuse protection, isolated staging/E2E validation, monitoring,
backup/restore, and approved privacy/retention/deletion behavior remain open
gates. The local runbook in `docs/pilot-release-runbook.md` describes the
staging and operational checks to complete.

## Restart instructions

1. Read `../rentalin-publish-ready-handoff.md` and applicable `AGENTS.md`
   files. Preserve the eight-PR dependency chain above.
2. Check the current GitHub branches, PRs, checks, and exact base/head SHAs.
   PRs 01–08 are already open as drafts; do not merge or deploy.
3. Verify hosted Actions for PRs #5–#12 and record the results. The hosted
   branch heads and exact base SHAs are listed in the queue.
4. Resolve code review and all security blockers before staging. Use disposable
   accounts and data in a confirmed isolated environment.
5. Record exact commands, outcomes, environment, and limitations. Do not
   convert blocked gates into passes because local builds succeeded.
6. Leave merges and production deployment for explicit owner approval.
