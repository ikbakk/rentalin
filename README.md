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

Install dependencies in each package directory; each package has an independent
Bun lockfile:

```bash
bun install
cd frontend && bun install
cd ../landing && bun install
cd ..
```

Configure `frontend/.env.local` with the URL of your Convex development
deployment. On first startup, Convex may ask you to sign in or choose a
development deployment; it stores that selection in the ignored root
`.env.local` file. Make sure `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_SITE_URL` in
`frontend/.env.local` point to that same deployment.

Start the backend, app, and marketing site together from the repository root:

```bash
bun run dev
```

This starts Convex, Next.js at [http://localhost:3000](http://localhost:3000),
and Astro at [http://localhost:4321](http://localhost:4321). Press Ctrl+C to
stop all three. The landing dev server points its demo and login links to the
local app and uses a sample WhatsApp number. These development values do not
change the landing site's production environment.

### Development demo account

The configured Convex development deployment has a populated demo workspace for
trying the authenticated app. Start the local app with `bun run dev`, then sign
in at [http://localhost:3000/login](http://localhost:3000/login):

- Email: `demo@rentalin.app`
- Password: `RentalinDemo2026`
- Business: Bali Motorent (sample fleet and operations data)

This account and its sample records belong to the Rentalin development
Convex deployment; they are not available on production unless separately
created there.

For release or standalone package builds, copy each runtime's example file and
fill in the public URLs or contact number:

```env
cp frontend/.env.example frontend/.env.local
cp landing/.env.example landing/.env
```

`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and `NEXT_PUBLIC_FRONTEND_URL` belong in `frontend/.env.local`. The marketing site's `PUBLIC_WHATSAPP_NUMBER` belongs in `landing/.env`. These values are configuration; do not put API secrets in `NEXT_PUBLIC_*` or `PUBLIC_*` variables. The example files contain placeholders, and release builds stop until valid values are set.

For Convex Auth, configure the same site URL on the Convex deployment itself as well as in the frontend build environment:

```bash
bunx convex env set CONVEX_SITE_URL
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
bun install --frozen-lockfile
bun run typecheck
bun run test
cd frontend && bun install --frozen-lockfile && bun run typecheck && bun run lint && bun run test:release-env && bun run build
cd ../landing && bun install --frozen-lockfile && bun run test:release-env && ASTRO_TELEMETRY_DISABLED=1 bun run build
```

Install each package separately from its directory; each has its own Bun lockfile. Lint currently reports existing warnings but no errors. The frontend
and Convex typechecks, Convex tests, and both production builds must pass. Convex
deployment code generation remains available through `bunx convex dev --once`
when a development deployment is configured.

## Deployment

Deploy Convex first, then deploy the frontend and landing site independently:

```bash
bun run convex:deploy
```

## Deployment configuration and operational checks

Start with [docs/deployment.md](docs/deployment.md) and the root,
`frontend/`, and `landing/` `.env.example` files. New inspection photos use a
private Cloudflare R2 bucket; Convex retains metadata and authorization.
Password recovery uses Resend; public inquiries require Turnstile. Optional
Sentry DSNs enable privacy-filtered Next.js error capture.

```sh
bun run test:ops
RENTALIN_ENV_FILE=.env.local bun run preflight:backend
```

The preflight checks values only. Configure backend secrets in the actual
Convex deployment, not just a local file. Live storage/email/Turnstile tests,
monitoring alerts, and an isolated backup restore remain release gates.
