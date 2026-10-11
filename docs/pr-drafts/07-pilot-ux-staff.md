**Base:** `feat/manual-payment-ledger` (`8285afa9fb2293669edda80feb587dd147eb6219`) | **Head:** `feat/pilot-ux-staff-admin` (`5764c4ee3bf35587ce8f73ec02ffdfcc36012a27`)

## Problem

Backend booking and finance rules were not fully connected to operator screens,
staff had no safe business-scoped provisioning flow, and tracking contact
actions could target the renter instead of the rental business.

## Changes

- Add owner-only, 24-hour, single-use, email-bound staff invitations and safe
  member deactivation with last-owner protection.
- Connect inquiry review to reservation creation, show private customer/vehicle
  details to authorized members, and map backend statuses to operator actions.
- Add manual payment history and ledger export controls with owner/admin writes.
- Route tracking WhatsApp links to the business contact number with Indonesian
  number normalization and prefilled inquiry context.
- Add signup password confirmation and truthful copy for unsupported settings.
- Finish reservation-to-return data and pending states, business-timezone date
  handling for WIB/WITA/WIT, and retryable pre-rental inspections. A completed
  inspection is now enforced by Convex before a reservation can be marked ready
  or handed over; failed inspections retain their record and move non-inactive
  vehicles to maintenance.
- Remove the placeholder checklist, capture notes and tenant-claimed photos,
  allow deletion of explicitly removed pending uploads, and reject arbitrary
  external photo URLs at inspection completion.
- Send the public booking WhatsApp link to the business number and state
  accurately that booking requests are recorded for operator review.

## Compatibility, validation, and limitations

Adds invitation records and membership indexes; the follow-up workflow changes
reuse existing optional business time-zone and inspection relation fields and
add one protected file-removal mutation, so no data rewrite is required. Tests
cover invitation role, email binding, single use, expiry, staff denial, owner
protection, timezone validation, inspection/handover transitions, upload
cleanup, and invalid external photo attachment. Root typecheck and 42 Convex
tests pass; frontend typecheck, lint (36 warnings, zero errors), and Webpack
production build pass locally. Default Turbopack build is blocked by this
sandbox's process restriction. No staging/mobile E2E was possible. Password
recovery, verified tenant-bound upload ownership, cleanup of abandoned/rejected
uploads, robust public inquiry abuse protection, and operational services remain
blockers.
