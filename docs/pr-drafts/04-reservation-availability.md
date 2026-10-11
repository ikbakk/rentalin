**Base:** `fix/public-data-upload-controls` (`eb6911a0afbf25f41218edb7511c4a69946d0bf8`) | **Head:** `fix/reservation-availability-rules` (`4fa2c8f2b39f622e252bc99de1112e29bfa8b43f`)

## Problem

Reservation confirmation did not enforce one canonical date interval or
transactional vehicle availability, allowing overlapping bookings.

## Changes

- Parse timezone-explicit date intervals and canonicalize to UTC.
- Define half-open intervals: a reservation ending when another begins does not
  overlap.
- Check confirmed, preparing, ready, active reservations and active rentals
  within the same mutation that creates/confirms a reservation.
- Reject inactive/maintenance vehicles and unsafe non-integer IDR estimates.
- Make inquiry conversion repeat-safe and add the indexes needed for scoped
  availability queries.

## Compatibility and validation

The schema additions are indexes only. Existing reservation records remain.
Direct Convex tests cover malformed/reversed intervals, touching boundaries,
overlap, cancellation, vehicle constraints, and concurrent confirmation (one
winner). Root typecheck and tests pass locally. Historical records should be
reviewed in staging before enabling new booking writes.
