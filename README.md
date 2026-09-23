# Rentalin

Vehicle-rental operations software for small businesses in Indonesia.

## Architecture

Rentalin is a TypeScript-only application:

- `frontend/` — Next.js operations and public booking application.
- `convex/` — Convex database schema, authentication, realtime queries, mutations, storage, and scheduled work.
- `landing/` — Astro marketing site.

There is no separate REST API or .NET backend. Tenant-scoped operations use an explicit Convex business ID and authenticated membership authorization.

## Core tenancy model

- A user's first authenticated session provisions a default business and owner membership.
- Users can create and switch between businesses.
- Product records are authorized against the active business membership.
- Public booking and tracking use a business slug and opaque reservation/rental tokens; Convex document IDs are not public URLs.

## Local development

Install dependencies, then start Convex and the frontend in separate terminals:

```bash
npm install
npm run convex:dev
```

```bash
cd frontend
npm install
npm run dev
```

Set the Convex deployment URL printed by the first command in `frontend/.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Verification

```bash
npx convex dev --once
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

The lint command currently reports non-blocking warnings; the typecheck and production build must pass.

## Deployment

Deploy Convex first, then deploy the frontend and landing site independently:

```bash
npm run convex:deploy
```
