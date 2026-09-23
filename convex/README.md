# Rentalin Convex backend

Convex is Rentalin's only product backend. It owns the database schema, Convex Auth integration, realtime queries, mutations, file storage, and scheduled work. There is no .NET or REST API layer.

## Local setup

From the repository root:

```bash
npm install
npx convex dev
```

Copy the printed deployment URL to `frontend/.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Generate functions and validate them once without keeping the dev process running:

```bash
npx convex dev --once
```

## Tenancy and authorization

- `tenancy.ts` resolves authenticated membership and the selected active business.
- Tenant-scoped functions accept an explicit `businessId` and call membership authorization before accessing business data.
- New users are onboarded with a default business and owner membership; users can create and select additional businesses.
- `memberships` and `userPreferences` model user-to-business access and active-business selection.

## Public access

Anonymous booking pages resolve a business through its slug. Reservation and rental tracking uses opaque `publicToken` values and returns restricted metadata only. Do not add public functions that accept or disclose Convex document IDs.

## Deploy

```bash
npm run convex:deploy
```
