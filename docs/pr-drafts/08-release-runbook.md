**Base:** `feat/pilot-ux-staff-admin` (`5764c4ee3bf35587ce8f73ec02ffdfcc36012a27`) | **Head:** `docs/pilot-release-runbook` (hosted head is recorded in the tracker)

## Problem

There was no evidence-based pilot runbook, and the readiness tracker still
reported early implementation work as pending without current test results or
operational blockers.

## Changes

- Add a staging preflight and disposable-data workflow for signup, public
  inquiry, reservation, handover, return, staff, payments, CSV, and tracking.
- Document environment separation, monitoring ownership, backup/restore,
  rollback, privacy/retention, and release decision requirements.
- Update the readiness tracker with hosted branch/base/head SHAs, verification
  outcomes, security limitations, and current release blockers.
- Prepare copy-ready descriptions for PRs 01–08.

## Compatibility and validation

Documentation only; no schema or runtime change. `git show --check` passes.
Staging, hosted CI, monitoring, backup/restore, password recovery, and
production deployment remain unverified and are explicitly blocked. This PR
does not authorize production publication.
