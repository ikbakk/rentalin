# Rentalin frontend

Next.js application for Rentalin's authenticated rental workspace and public booking/tracking pages.

## Environment

Copy the example to `frontend/.env.local`, then replace the placeholders with the values for your environment:

```bash
cp frontend/.env.example frontend/.env.local
```

Set `NEXT_PUBLIC_CONVEX_URL` to the deployment's public `.convex.cloud` URL, `CONVEX_SITE_URL` to its matching `.convex.site` URL, and `NEXT_PUBLIC_FRONTEND_URL` to the app origin used in generated booking links. `NEXT_PUBLIC_*` values are visible to browsers and must never contain secrets.

Convex Auth reads `CONVEX_SITE_URL` from the Convex deployment environment too. Configure it there with `npx convex env set CONVEX_SITE_URL` and enter the matching `.convex.site` URL when prompted. This deployment setting is separate from `frontend/.env.local`.

The frontend build runs `npm run preflight:release` automatically and fails clearly when required URLs are missing, local-only, or malformed. Run `npm run test:release-env` to check those rules without credentials.

## Development

Start Convex from the repository root first:

```bash
npm run convex:dev
```

Then run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data and authentication

The frontend uses Convex Auth and Convex React hooks directly. It does not use a REST client, browser JWT/localStorage helper, or `NEXT_PUBLIC_API_URL`.

Authenticated workspace queries and mutations include the active business ID, which Convex validates against the user's membership. The app shell exposes a business switcher for users with more than one business.

Public pages use business slugs and opaque reservation/rental tokens only; they never expose Convex document IDs.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:release-env
npm run build
```

`npm run lint` may report existing warnings, but it must complete without errors before deployment.
