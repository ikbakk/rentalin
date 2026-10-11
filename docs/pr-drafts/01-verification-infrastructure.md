**Base:** `main` (`58bd1471264886d351abfeedbe663b6f444162b1`) | **Head:** `chore/ci-release-readiness` (`ac2836a137bb966b5f9944df97ef0922e8551b9e`)

## Problem

The repository had no repeatable backend test harness or CI workflow. Frontend
and landing builds had only been checked manually, and Convex checks were not
reproducible from a clean checkout.

## Changes

- Add root Convex TypeScript and Vitest scripts, a `convex-test` harness, and
  strict Convex compiler settings.
- Add independent GitHub Actions checks for Convex, the Next.js app, and the
  Astro landing site. CI does not deploy or require production credentials.
- Document reproducible install/build commands and the deployment-codegen
  limitation.

## Compatibility and validation

No database migration or runtime behavior change. Root, frontend, and landing
dependencies install sequentially. Root typecheck/tests, frontend
typecheck/lint/build, and the telemetry-disabled landing build pass locally.
Frontend lint has 49 baseline warnings and no errors. Convex deployment
codegen remains blocked until a development deployment is configured. The
first hosted run found that frontend CI needed root Convex dependencies and
needed to run for stacked PR bases; both workflow issues are fixed in the
current hosted head, and rerun results are pending.
