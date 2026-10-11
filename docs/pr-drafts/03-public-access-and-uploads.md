**Base:** `fix/tenant-authorization` (`7e3c5a01fb1c302cc85ace1820bb2659c0d70784`) | **Head:** `fix/public-data-upload-controls` (`eb6911a0afbf25f41218edb7511c4a69946d0bf8`)

## Problem

Public reads returned internal business data, tracking links exposed renter
contact details, uploads were not tenant-gated, and inquiry input lacked
server-side bounds and abuse controls.

## Changes

- Return explicit public business, vehicle, and tracking fields; redact renter
  name/phone and vehicle plate from public list responses.
- Add indexed bearer-token lookup and owner-controlled tracking-token rotation.
- Require tenant access to generate and attach inspection uploads; check image
  type and size server-side and record tenant-scoped claims.
- Bound public inquiry fields, validate requested vehicle/availability, and
  add a basic normalized-phone submission throttle.
- Replace password-provider defaults with a 12-character minimum for signup.

## Compatibility, validation, and limitations

Additive indexes and tables; existing tracking links remain valid until
rotated. Tests cover public redaction, cross-business access, token rotation,
and malformed submissions. The phone throttle is not robust IP/edge abuse
protection. Standard Convex upload URLs do not cryptographically bind the
returned storage ID to a tenant; first-claim ownership and orphan cleanup
remain release blockers. Password reset still needs an email provider and
recovery flow. Root typecheck and tests pass locally; hosted CI is pending.
