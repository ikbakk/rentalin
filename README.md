# Rentalin

**Vehicle rental operations platform for small businesses in Indonesia.**

Rentalin is not a marketplace. Not a customer app. It's the back-office system that runs a rental shop — the bridge between WhatsApp conversations and real vehicles on the road with real customers in them.

---

## What It Does

Staff at a rental business (1–50 vehicles) pick up their phone, tap through these flows:

| Flow | Reality |
|------|---------|
| **Inquiry** | Customer WhatsApps asking about a car. Staff logs it, checks availability, sends quote. |
| **Reservation** | Customer confirms. Staff converts to booking, collects deposit. |
| **Prep** | Clean, fuel, check documents, take photos before pickup. |
| **Handover** | ID check, digital signature, odometer photo, hand over keys. |
| **Rental** | Vehicle is out. Track, handle extensions, flag overdue. |
| **Return** | Record odometer/fuel, quick visual check, get keys back. |
| **Inspection** | Detailed check with photos after every return. Catch damage. |

Plus: payments (cash/transfer/e-wallet), damage records, maintenance tracking, and an immutable timeline audit log.

**Three design constraints**: three-tap rule, five-second clarity, works one-handed in sunlight on patchy Indonesian mobile internet.

---

## Architecture

```
rentalin/
├── backend/                  # .NET 10 API
│   ├── src/
│   │   ├── Rentalin.Api/           # Minimal API endpoints, auth, middleware
│   │   ├── Rentalin.Core/          # Shared domain: entities, value objects
│   │   ├── Rentalin.Fleet/         # Vehicles, businesses, staff
│   │   ├── Rentalin.Reservations/  # Customers, inquiries, reservations, rentals, payments
│   │   ├── Rentalin.Inspections/   # Pre/post-rental vehicle inspections
│   │   ├── Rentalin.Timeline/      # Immutable audit log entries
│   │   ├── Rentalin.Damage/        # Damage recording and resolution
│   │   ├── Rentalin.Maintenance/   # Vehicle maintenance scheduling
│   │   ├── Rentalin.Notifications/ # Notification records (WhatsApp/email stubs)
│   │   └── Rentalin.Infrastructure/# EF Core, SQLite, repositories, migrations
│   └── tests/                # Domain unit tests + integration tests
├── frontend/                 # Next.js 16 (App Router) + Tailwind v4 + shadcn/ui
│   ├── src/app/(app)/        # Authenticated workspace: fleet, customers, reservations…
│   ├── src/app/(public)/     # Public: landing, login, booking portal, tracking
│   └── src/hooks/            # TanStack Query hooks for all API calls
├── nginx/                    # Reverse proxy config (rate-limited, TLS-ready)
├── docker-compose.yml        # 3-service deployment (backend + frontend + nginx)
├── user-flows.md             # 13 detailed flow specifications
├── state-machines.md         # Every legal state transition for every aggregate
├── monitoring.md             # Observability: logs, metrics, traces, alerts, SLOs
├── analytics-plan.md         # North Star metric, funnels, dashboards, event taxonomy
├── security-review.md        # OWASP Top 10 assessment, threat model, UU PDP compliance
├── testing-strategy.md       # Pyramid approach, xUnit + FluentAssertions + Playwright
└── ux-architecture.md        # Information architecture, navigation, design spec
```

### Stack

- **Backend**: .NET 10, ASP.NET Core Minimal APIs, MediatR (CQRS), EF Core 10, SQLite
- **Frontend**: Next.js 16.2 (React 19), Tailwind CSS v4, shadcn/ui + Base UI, TanStack Query v5
- **Auth**: JWT (HS256), BCrypt password hashing, role-based authorization (Owner/Admin/Staff)
- **Infra**: Docker multi-stage builds, nginx reverse proxy, health checks, rate limiting

---

## Quick Start

### Development

```bash
# Backend
cd backend
dotnet run --project src/Rentalin.Api
# → http://localhost:5000
# Login: admin@rentalin.com / admin123

# Frontend (in another terminal)
cd frontend
pnpm dev
# → http://localhost:3000
```

### Production (Docker)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with production values
docker compose up -d
# → nginx on :80/:443, backend on internal :5000, frontend on internal :3000
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ConnectionStrings__Default` | Database connection string | `Data Source=rentalin.db` (dev) |
| `Jwt__Secret` | JWT signing key | Dev fallback only |
| `Cors__FrontendOrigin` | Allowed CORS origin | `http://localhost:3000` (dev) |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:5000` (dev) |

---

## API Endpoints

All internal endpoints require JWT authentication. Public endpoints are open.

| Group | Path | Auth |
|-------|------|------|
| **Auth** | `/api/auth/login`, `/api/auth/me` | Login: public, Me: required |
| **Vehicles** | `/api/vehicles/*` | Required |
| **Customers** | `/api/customers/*` | Required |
| **Inquiries** | `/api/inquiries/*` | Create: public, Rest: required |
| **Reservations** | `/api/reservations/*` | Required |
| **Rentals** | `/api/rentals/*` | Required |
| **Payments** | `/api/payments/*` | Required |
| **Inspections** | `/api/inspections/*` | Required |
| **Timeline** | `/api/timeline` | Required |
| **Operations** | `/api/operations/*` | Required |
| **Search** | `/api/search` | Required |
| **Uploads** | `/api/uploads/*` | Required |
| **Public** | `/api/public/*`, `/api/portal/*` | Public |
| **Health** | `/health`, `/health/ready` | Public |

---

## Testing

```bash
# Backend unit tests
cd backend
dotnet test tests/Rentalin.Domain.Tests

# Backend integration tests
dotnet test tests/Rentalin.Integration.Tests
```

Test pyramid: 75% unit (xUnit + FluentAssertions + NSubstitute), 20% integration (WebApplicationFactory + in-memory SQLite), 5% E2E (Playwright — planned).

---

## Status

**Pre-MVP.** Core domain complete — all state machines implemented, API endpoints operational, auth enforced. Frontend has working workspace with some UI stubs. Deployment artifacts (Docker, nginx, health checks) in place. Missing: real payment gateway integration, WhatsApp/email notifications (currently log stubs), offline sync, E2E tests.
