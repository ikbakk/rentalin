**Base:** `chore/ci-release-readiness` (`67ae1ad5d9dfb63ffa02e0af4d24efa90a6c6e1f`) | **Head:** `fix/tenant-authorization` (`7e3c5a01fb1c302cc85ace1820bb2659c0d70784`)

## Problem

Several Convex functions accepted business or related-record IDs without
consistently enforcing authentication, membership, role, and tenant ownership.
Legacy external-ID settings access also bypassed the tenant model.

## Changes

- Centralize membership and permission checks, including business existence
  and active membership validation.
- Enforce owner-only settings/staff controls and admin/owner permissions for
  fleet pricing and payment administration; scope reads and mutations to the
  active tenant.
- Validate optional customer, inquiry, vehicle, and reservation references
  against the authorized business.
- Replace the unsafe external-ID settings mutation with a typed,
  owner-authorized business-ID update.

## Compatibility and validation

Changes are additive; no records are deleted or rewritten. Existing callers
must use the typed settings mutation. Direct Convex tests cover anonymous,
cross-business, inactive-member, revoked-membership, and role-denial cases.
Root typecheck and affected tests pass. Hosted CI and staging authorization
smoke tests remain pending.
