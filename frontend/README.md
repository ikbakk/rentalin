# Rentalin frontend

Next.js application for Rentalin's authenticated rental workspace and public booking/tracking pages.

## Environment

Create `frontend/.env.local` with the Convex deployment URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

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
npx tsc --noEmit
npm run lint
npm run build
```

`npm run lint` may report existing warnings, but it must complete without errors before deployment.
