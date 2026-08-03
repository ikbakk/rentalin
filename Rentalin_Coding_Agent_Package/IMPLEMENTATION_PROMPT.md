# Implementation Prompt — Rentalin MVP Completion

## Context

Rentalin is a .NET 8 (CQRS + MediatR + EF Core + SQLite) backend with a Next.js 16 frontend. Owner-first operational tool for vehicle rental businesses. No customer accounts. Complements WhatsApp.

Current state: ~65% complete — core domain model, API surfaces, and 7 of 13 frontend screens built. This prompt covers everything missing for MVP.

Read `ARCHITECTURE_DECISIONS.md`, `BUSINESS_RULES.md`, `state-machines.md`, `user-flows.md`, `ux-architecture.md`, and `DOMAIN_MODEL.md` before writing code. Preserve existing domain patterns. No unnecessary abstractions.

---

## Part 1: Landing / Marketing Page

**Route:** `/` (public, unauthenticated)  
**Location:** `frontend/src/app/landing/` or repurpose existing `frontend/src/app/page.tsx` as a marketing page (move current shell elsewhere).

Build a single-page marketing site for Rentalin:
- Hero section: tagline — "Operational coordination for vehicle rental businesses"
- Feature highlights: Fleet management, Inquiries → Reservations → Rentals flow, Inspection checklists with photo documentation, Timeline audit trail
- Target audience signals: "For rental businesses with 1–50 vehicles", "Indonesia-first", "Works offline, outdoors, one-handed"
- Login CTA button → `/login`
- Clean, professional dark theme matching the existing design system (OKLCH tokens in ux-architecture.md)
- Mobile-first responsive layout
- No customer signup — this is an internal tool marketing page, not a marketplace

---

## Part 2: Missing Detail Pages (Frontend Only)

Backend APIs mostly exist; check each before building.

### 2.1 Fleet Detail — `/fleet/[id]`

**Backend:** Backend has no GET `/api/vehicles/{id}` endpoint. Add it first: `GetVehicleByIdRequest` → `GetVehicleByIdHandler` returning `VehicleResponse`. Add `FleetEndpoints.cs` route.

**Frontend page:**
- Back nav + plate number header
- Tabs: Overview | History | Photos | Maintenance
- Overview: status chip, current rental (if active), specs (make, model, year, color, seats, daily rate)
- History: past rentals list from rental history endpoint
- Photos: inspection photo gallery with date grouping
- Maintenance: log + "Schedule Maintenance" button (UI only, backends not built yet)

### 2.2 Customer Detail — `/customers/[id]`

**Backend:** Backend has no GET `/api/customers/{id}` endpoint. Add `GetCustomerByIdRequest` → handler → `CustomerEndpoint.cs` route.

**Frontend page:**
- Back nav + customer name header
- Contact card: phone, WhatsApp quick-link
- Past rentals list
- Active rentals section (if any)
- Active inquiries section (if any)
- Internal notes (editable textarea, auto-save via PUT)
- Stats row: total rentals, total spent
- FAB: "New Inquiry" for this customer

### 2.3 Inspection Detail — `/inspections/[id]`

**Backend:** GET `/api/inspections/{id}` already exists.

**Frontend page:**
- Back nav + inspection type badge (PreRental / PostRental)
- Vehicle info header (plate, make/model)
- Photo gallery grid with expand-to-fullscreen
- Side-by-side comparison view (post-rental vs pre-rental photos)
- Checklist per vehicle zone (Exterior, Interior, Mechanical, Documents)
- "Pass Inspection" / "Fail — Report Damage" buttons
- CompleteInspectionDialog: confirmation modal with notes field

---

## Part 3: Public Booking Page — `/book`

**Location:** `frontend/src/app/(public)/book/page.tsx`

**Backend:** Backend has no public vehicle listing endpoint. Add `GET /api/public/vehicles` returning available vehicles only (status = Available). Unauthenticated.

**Frontend page:**
- Business branding (logo, name) at top
- Vehicle cards in grid — photo placeholder, make/model, daily rate
- Vehicle detail sheet — specs, "Inquire" form
- Inquiry form: name, phone, desired dates, message
- Success confirmation after submission
- Labels in Bahasa Indonesia preferred
- Lighter visual treatment vs internal app

---

## Part 4: Customer Transaction Portal — `/tx/[id]`

**Location:** `frontend/src/app/(public)/tx/[id]/page.tsx`

**Backend:** GET `/api/portal/reservation/{id}` already exists.

**Frontend page:**
- Rental status tracker (progress bar: Confirmed → Active → Returning → Completed)
- Key details: vehicle info, rental dates, remaining days
- Payment section: amount paid, balance due
- WhatsApp contact button for support
- Friendly error state if token invalid/expired

---

## Part 5: Damage Flow

### Backend — New `Rentalin.Damage` module (or extend Inspections)

Follow existing clean architecture pattern with CQRS:

**Domain:**
- `DamageRecord` aggregate: id, rentalId, vehicleId, description, severity (Minor/Moderate/Major), status (Open/Resolved/Waived), photos (list of Attachment), responsibleParty (Customer/Business), resolutionNotes, createdAt
- `DamageRecordStatus` enum: Open, AwaitingCustomer, AwaitingQuote, Resolved, Waived

**Handlers:**
- `CreateDamageRecord` — POST `/api/damage`
- `GetDamageRecords` — GET `/api/damage?rentalId=`
- `ResolveDamage` — PUT `/api/damage/{id}/resolve`
- `WaiveDamage` — PUT `/api/damage/{id}/waive`

**Domain events:** `DamageRecordCreated`, `DamageResolved`, `DamageWaived` → TimelineEntry handlers

### Frontend

- Damage section inside Inspection Detail page (or as a tab on Rental detail)
- Card per damage record: severity badge, description, photos, status chip
- "Resolve" / "Waive" action buttons
- Damage list on Operations dashboard

---

## Part 6: Rental Extension Flow

### Backend — Extend `Rentalin.Reservations`

**To Rental aggregate:**
- `Extend(DateTimeOffset newEnd, Money additionalCost)` method
- Guard: newEnd must be after current end. Check vehicle availability for extended period.
- Extend domain event → TimelineEntry

**Handlers:**
- `ExtendRentalRequest(rentalId, newEnd, additionalAmount, currency)` → PUT `/api/rentals/{id}/extend`

### Frontend

- "Extension" button on active Rental cards
- Dialog: new return date picker + system checks availability + displays additional cost
- "Confirm Extension" action
- Rental status shows "Active (Extended)" badge

---

## Part 7: Maintenance Flow

### Backend — New `Rentalin.Maintenance` module

**Domain:**
- `MaintenanceRecord` aggregate: id, vehicleId, type (RegularService/Repair/TyreChange/BodyWork/Other), description, status (Scheduled/InProgress/Completed/Cancelled), scheduledStart, actualStart, actualEnd, cost, workshop, notes, photos
- `MaintenanceStatus` enum: Scheduled, InProgress, Completed, Cancelled

**Handlers:**
- `CreateMaintenance` — POST `/api/maintenance`
- `GetMaintenance` — GET `/api/maintenance?vehicleId=`
- `StartMaintenance` — PUT `/api/maintenance/{id}/start`
- `CompleteMaintenance` — PUT `/api/maintenance/{id}/complete`
- `CancelMaintenance` — PUT `/api/maintenance/{id}/cancel`

**On CompleteMaintenance:** Trigger post-maintenance inspection. Vehicle status goes from Maintenance → In Inspection → Available (via InspectionCompleted handler).

### Frontend

- Maintenance tab on Fleet Detail page
- "Schedule Maintenance" button → dialog with type, description, scheduled date
- Maintenance list: status chips, date range, workshop, cost
- Maintenance detail view (inline or expandable card)

---

## Part 8: Overdue Detection

### Backend

- `Rental.Overdue` state already planned in state-machines.md
- Add `Overdue` to `RentalStatus` enum
- Background job / scheduled task: query rentals where `status == Active && ActualEnd == null && RentalPeriod.End < DateTimeOffset.UtcNow` — set status to `Overdue`
- Publish `RentalOverdue` domain event → TimelineEntry

### Handlers:
- `MarkOverdueRequest(rentalId)` — internal/system call

### Frontend
- Overdue rentals shown on Operations dashboard under "Action Required" (red)
- Rental cards show "Overdue by X days" badge
- Filter by Overdue on Reservations page Rentals tab

---

## Part 9: Inspection Failed State

### Backend — Extend Inspections module

**To Inspection aggregate:**
- `Fail(string reason)` method — domain guard: must be `InProgress`, notes must be populated
- Add `Failed` to `InspectionStatus` enum
- `Fail()` sets status to `Failed`, publishes `InspectionFailed` event
- Handler: set vehicle status to `Maintenance`, create DamageRecord automatically

**Handlers:**
- `FailInspectionRequest(inspectionId, reason, notes)` — PUT `/api/inspections/{id}/fail`

### Frontend
- "Fail — Report Damage" button on Inspection Detail page
- Dialog: reason field + "Create Damage Record" confirmation
- Failed inspections shown with red status chip on Inspections list
- Failed inspections badge on Operations dashboard

---

## Part 10: Payment Refunded State

### Backend — Extend Payments module

**To Payment aggregate:**
- `Refund()` method — domain guard: must be `Completed`
- Add `Refunded` to `PaymentStatus` enum
- Publish `PaymentRefunded` domain event → TimelineEntry

**Handlers:**
- `RefundPaymentRequest(paymentId)` — PUT `/api/payments/{id}/refund`

### Frontend
- "Refund" button on completed payments (visible to Owner role only)
- Confirmation dialog: refund amount, reason
- Payment card shows "Refunded" badge if applicable

---

## Part 11: Notifications (WhatsApp Integration Framework)

### Backend

Build a notification infrastructure layer. Do NOT integrate actual WhatsApp API — build the framework:

- `INotificationService` interface: `SendWhatsApp(phone, message)`, `SendEmail(email, subject, body)`
- `WhatsAppNotificationService` implementation: logs to console + stores in `NotificationRecord` table
- `NotificationRecord` entity: id, type (WhatsApp/Email), recipient, template, status (Queued/Sent/Delivered/Failed), createdAt, sentAt
- Domain event notification handlers for key events (e.g., `RentalCreated → send "Your rental is confirmed" to customer`)
- Wire via MediatR notification handlers (existing pattern)

### Frontend

- Notification preferences toggle in Settings (WhatsApp on/off, Email on/off)
- Notification log page (optional, future)

---

## Part 12: Missing Backend Endpoints Checklist

- `GET /api/vehicles/{id}` — Vehicle detail (GetVehicleById)
- `GET /api/customers/{id}` — Customer detail (GetCustomerById)
- `GET /api/public/vehicles` — Public available vehicles list (unauthenticated)
- `GET /api/rentals/history/{vehicleId}` — Rental history for a vehicle
- `GET /api/public/rentals/{id}` — Public rental tracker (unauthenticated, matches existing portal)
- `POST /api/inspections/{id}/fail` — Fail an inspection

---

## Implementation Order

1. Part 12 (missing backend endpoints) — quick wins, unblock frontend
2. Part 3 (public booking `/book`) + Part 4 (transaction portal `/tx/[id]`) — unauthenticated customer pages
3. Part 2 (detail pages) — fleet, customer, inspection detail views
4. Part 1 (landing page) — marketing
5. Part 9 (inspection failed) + Part 8 (overdue) — small backend + frontend additions
6. Part 10 (payment refund) — small addition
7. Part 6 (extension) — new workflow
8. Part 5 (damage) — new module
9. Part 7 (maintenance) — new module
10. Part 11 (notifications) — infrastructure

---

## Constraints

- Do NOT add customer accounts, auth for public pages, or marketplace features
- Do NOT integrate real WhatsApp/payment APIs — build the framework only
- Do NOT add AI features
- Preserve existing domain patterns, state machine guards, and event-driven architecture
- Follow `ux-architecture.md` design tokens and component specs for all frontend work
- Use existing shadcn UI primitives and shared components from `frontend/src/components/shared/`
- Frontend: React hooks in `frontend/src/hooks/`, types in `frontend/src/lib/types.ts`, API client in `frontend/src/lib/api.ts`
- Backend: match existing CQRS structure (Request record → Handler → Endpoint mapping in Program.cs)
