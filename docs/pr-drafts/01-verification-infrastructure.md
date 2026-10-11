**Base:** `main` (`58bd1471264886d351abfeedbe663b6f444162b1`) | **Head:** `chore/ci-release-readiness` (`67ae1ad5d9dfb63ffa02e0af4d24efa90a6c6e1f`)

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
codegen remains blocked until a development deployment is configured; hosted
Actions results are pending publication.
