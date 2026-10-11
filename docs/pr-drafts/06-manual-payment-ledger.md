**Base:** `fix/repeat-safe-rental-lifecycle` (`bda9f69c81e44688d675644ec661221bc902a33e`) | **Head:** `feat/manual-payment-ledger` (`8285afa9fb2293669edda80feb587dd147eb6219`)

## Problem

Revenue was not based on recorded receipts, and the app had no append-only
payment history, refund controls, or tenant-scoped ledger export.

## Changes

- Add payment, deposit, and refund ledger entries with positive integer IDR
  amounts, actor/time, method/reference, and an idempotency key.
- Limit writes to owner/admin, cap refunds to refundable receipts, and allow
  cancellation refunds without silently overwriting history.
- Calculate received/outstanding amounts and tenant-local daily totals from the
  ledger.
- Add CSV export with bounded results and spreadsheet-formula escaping.
- Label figures as manually recorded payments rather than verified gateway
  settlement.

## Compatibility and validation

The new payment table is additive and existing reservation records are
preserved. Tests cover deposits, partial payments, refunds, retries, tenant
isolation, business-day boundaries, and CSV escaping. Root typecheck and tests
pass locally. Entries are manual records and do not prove a transfer settled.
