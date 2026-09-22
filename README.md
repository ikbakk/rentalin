# Rentalin

Vehicle-rental operations software for small businesses in Indonesia.

## Stack

- Next.js frontend (`frontend/`)
- Convex database, functions, realtime, storage, and auth (`convex/`)
- Astro marketing site (`landing/`)

## Development

```bash
npm install
npx convex dev
cd frontend && npm run dev
```

Set `NEXT_PUBLIC_CONVEX_URL` from the Convex command output in `frontend/.env.local`.

## Deployment

Deploy Convex with `npm run convex:deploy`; deploy the Next.js frontend and landing site independently or run `docker compose up`.
