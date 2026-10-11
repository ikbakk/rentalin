**Base:** `fix/reservation-availability-rules` (`4fa2c8f2b39f622e252bc99de1112e29bfa8b43f`) | **Head:** `fix/repeat-safe-rental-lifecycle` (`53225e58c1ed22a2202c18caf661995b529cc973`)

## Problem

Rental start/return transitions could be repeated or applied to reservations
in invalid states, and returning a vehicle could erase other operational
constraints.

## Changes

- Permit rental start only for a ready reservation and return the existing
  rental on safe retries.
- Validate integer odometer readings and require the return reading not to
  precede the start reading.
- Keep maintenance/inactive vehicle state intact and respect other valid
  reservations when completing a rental.
- Write actor, timestamp, business, and record-reference activity entries in
  the same transaction as lifecycle changes.
- Allow pre-rental inspections to be attached to a reservation before rental
  creation and link them on handover.

## Compatibility and validation

Activity history is additive; no existing rows are rewritten. Direct Convex
tests cover repeated/concurrent starts, invalid transitions, return constraints,
and vehicle availability after return. Inspections are supported but remain
optional for handover; a mandatory inspection policy must be decided before a
pilot that requires it. Root typecheck and tests pass locally.
