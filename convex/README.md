# Rentalin Convex backend

Convex is the product backend: database, queries, mutations, realtime updates, and scheduled work.

## Local setup

```bash
npx convex dev
```

Copy the printed deployment URL into `frontend/.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

The old .NET API remains untouched during migration. New product work should go into this directory instead of adding new .NET endpoints.
