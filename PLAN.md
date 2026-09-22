# Convex Completion Plan

## Context

Rentalin has removed the .NET backend and nginx. The Next.js frontend and Convex backend are now the intended architecture, but the frontend still relies on legacy JWT/localStorage tenancy and seven REST-only paths. This plan completes the backend cutover without reintroducing a separate API server.

## Current findings

- Convex Auth is installed and uses the password provider (`convex/auth.js`), but no staff/business membership mapping exists.
- Product data already has business ownership fields, but many frontend hooks still resolve a business through `frontend/src/lib/auth.ts` rather than the authenticated Convex user.
- Remaining REST paths: public booking metadata, booking/rental tracking, search bar, command palette, vehicle rental history, and `frontend/src/lib/api.ts`.
- Convex storage upload URLs are implemented in `convex/files.ts`; the old upload helper is removed.

## Approach

Create a first-class Convex membership model that lets an authenticated user manage multiple businesses and select an active business. Every tenant-scoped function verifies membership in the requested business before reading or writing data. Add opaque public tokens to reservations/rentals for anonymous tracking, tenant-scoped search/history queries, and an onboarding flow that creates a default business for the first account while supporting manual business creation and empty states.

## Files to modify

- `convex/schema.ts`
- `convex/auth.js`
- `convex/businesses.ts`, `convex/fleet.ts`, `convex/rentals.ts`, `convex/reservations.ts`
- New: `convex/memberships.ts`, `convex/search.ts`, `convex/public.ts`
- `frontend/src/lib/auth.ts`, `frontend/src/lib/api.ts` (delete after callers move)
- Remaining hooks and public screens identified above

## Reuse

- Convex Auth provider: `convex/auth.js`, `frontend/src/app/providers.tsx`
- Existing business indexes: `convex/schema.ts`
- Existing tenant-scoped product function conventions: `convex/customers.ts`, `convex/dashboard.ts`
- Convex storage upload URL mutation: `convex/files.ts`

## Steps

- [x] Define `memberships`, active-business preference, business creation fields, and opaque public reservation/rental token fields in the Convex schema.
- [ ] Add authenticated membership resolution with role checks; authorize every tenant-scoped Convex function against an explicit business ID instead of legacy external IDs.
- [ ] Implement onboarding: first account creates a default business and owner membership; users can create/select additional businesses; render workspace empty states when a business has no fleet or activity.
- [ ] Replace all legacy `getAuth()` tenancy access with an authenticated active-business hook/query and add a business switcher to the app shell.
- [ ] Add tenant-scoped search and rental-history functions; migrate search UI and history hook.
- [ ] Add public booking metadata and opaque-token-scoped reservation/rental tracking functions; migrate public pages without exposing document IDs.
- [ ] Remove REST client, JWT/localStorage helper, API URL variables, and React Query wrappers no longer needed.
- [ ] Run Convex deployment/type generation, frontend typecheck/lint/build, and browser smoke tests.

## Verification

- Sign up a user and verify automatic default-business/owner-membership creation.
- Create a second business, switch active business, and verify records remain tenant-isolated.
- Confirm cross-business records are inaccessible from queries and mutations for every role.
- Validate public slug booking and opaque-token tracking without authentication or document-ID leakage.
- Confirm uploads return usable Convex storage IDs/URLs.
- `npx convex dev --once`
- `cd frontend && npx tsc --noEmit && npm run lint && npm run build`
