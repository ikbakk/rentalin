**Base:** `fix/public-data-upload-controls` (`2c6a6f44e536e0ea66b50323d4251c478d6b17a9`) | **Head:** `fix/reservation-availability-rules` (`0aa18c96e45d5d060fd6ae81f2513a58aab84cc8`)

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
