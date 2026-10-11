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

Copy each runtime's example file and fill in the public URLs or contact number before starting or building it:

```env
cp frontend/.env.example frontend/.env.local
cp landing/.env.example landing/.env
```

`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and `NEXT_PUBLIC_FRONTEND_URL` belong in `frontend/.env.local`. The marketing site's `PUBLIC_WHATSAPP_NUMBER` belongs in `landing/.env`. These values are configuration; do not put API secrets in `NEXT_PUBLIC_*` or `PUBLIC_*` variables. The example files contain placeholders, and release builds stop until valid values are set.

For Convex Auth, configure the same site URL on the Convex deployment itself as well as in the frontend build environment:

```bash
npx convex env set CONVEX_SITE_URL
```

Enter the URL shown by your Convex deployment when prompted. Convex deployment variables are separate from local Next.js `.env.local` values.

For the containerized local stack, export values from both runtime files before building:

```bash
set -a
. frontend/.env.local
. landing/.env
set +a
docker compose up --build
```

Docker Compose passes these public values as build arguments because Next.js and Astro bake them into generated assets. These values are public configuration, not credentials.

## Verification

```bash
npm ci
npm run typecheck
npm test
cd frontend && npm ci && npm run typecheck && npm run lint && npm run test:release-env && npm run build
cd ../landing && npm ci && npm run test:release-env && ASTRO_TELEMETRY_DISABLED=1 npm run build
```

Run the package installs sequentially: root `npm ci` removes nested `node_modules`
directories. Lint currently reports existing warnings but no errors. The frontend
and Convex typechecks, Convex tests, and both production builds must pass. Convex
deployment code generation remains available through `npx convex dev --once`
when a development deployment is configured.

## Deployment

Deploy Convex first, then deploy the frontend and landing site independently:

```bash
npm run convex:deploy
```
