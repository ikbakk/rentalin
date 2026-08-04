# Impeccable UI Audit — Authenticated Workspace (`(app)`)

- **Audit date:** 2026-08-04
- **Scope:** Authenticated app ONLY — `/operations`, `/fleet` (list + detail), `/customers` (list + detail), `/reservations`, `/inspections` (list + detail), `/events`, `/settings`, plus the shared shell (`layout.tsx`, sidebar, app-shell, nav-bar, page-header) and `(app)`-reachable dialogs.
- **Out of scope:** public pages (`/login`, `/r/[slug]` booking portal, landing), backend.
- **Mode:** Operate — staff completes a task one-handed, in sunlight, on patchy mobile internet (README design constraints).
- **Type:** Read-only audit per plan todo 9. **No source files changed.**
- **Method:** Loaded `impeccable` skill (audit reference), read every `(app)` page/component + shared/ui primitives + `globals.css`, and grepped for token drift, aria, dead controls, and interaction patterns. All findings verified against source lines at time of writing.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 1 | Zero `aria-label`s in the whole `(app)` + `shared` tree; `<tr>`/`<Card>` rows are clickable but not keyboard-activatable; raw-500 palette text and `/60` opacities fail contrast |
| 2 | Performance | 3 | Lightweight (no heavy animation); but 3 `<img>` without `next/image`, dual ⌘K search mounts on every list page, infinite `shimmer`/`pulse` skeletons |
| 3 | Responsive | 2 | Mobile-first shell is good, but global ⌘K pill overlaps every page FAB; touch targets consistently < 44px; fleet mobile has a silent empty-filter state |
| 4 | Theming | 2 | Tokens + dark mode exist, but status colors drift to raw `emerald/amber/blue-500` palette in 8+ duplicated maps; hardcoded `#25D366`; `font-heading` is a silent no-op |
| 5 | Implementation Integrity | 2 | Coherent product-specific shell, but 6 dead interactive controls, 4 unused duplicate view components, `ErrorBanner` never used, errors masquerade as empty states |
| **Total** | | **10/20** | **Acceptable — significant work needed** |

---

## Executive Summary

**Top issues to fix before Wave 4 todo 11 closes:**
1. **P0** — Global "⌘K Search" pill (`command-palette-wrapper.tsx:15`) sits at `fixed bottom-20 right-4 z-50` and physically overlaps the Add Vehicle / New Inquiry / New Inquiry FABs on `/fleet`, `/reservations`, and `/customers/[id]` at every breakpoint. The pill wins (z-50), so the primary action FABs are obscured.
2. **P0** — Two independent ⌘K handlers are mounted simultaneously on every list page: `search-bar.tsx:36-38` (rendered inside `PageHeader`) and `command-palette.tsx:203-206` (mounted in `(app)/layout.tsx`). Pressing ⌘K opens **two stacked modals**.
3. **P1** — Zero `aria-label`s in the entire audited tree. Icon-only buttons (fleet filter, collapse toggle when collapsed, all FABs, upload-close) and the 3 settings `Switch` rows are unnameable to assistive tech.
4. **P1** — All list/detail rows navigate via `onClick` on non-interactive elements (`<tr>`, `<Card>`, `<div>`); none are keyboard-focusable or Enter-activatable (WCAG 2.1.1).
5. **P1** — `ErrorBanner` is implemented but used nowhere; every fetch failure renders as a cheerful empty state ("No vehicles yet"), which trains staff to trust a possibly-empty list.

---

## Detailed Findings by Category

### A. Visual Hierarchy

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| High | A1 | `fleet/fleet-view.tsx:181-222` | On desktop the sort controls live in `CardHeader` as flat ghost buttons **above** an empty `<TableHeader>`; columns sort but there are no real column headers, so the table reads as a wall of identical rows. | Move sortable labels into `<th>` (`TableHead`) with `aria-sort`, make them the only header row; drop the empty `<TableRow>` at `fleet-view.tsx:226-228`. |
| High | A2 | `operations/operations-view.tsx:297-412` | Three near-identical Card render blocks (action/attention/info) with copy-pasted JSX differ only by Badge variant + one `opacity-75` on info cards (`:383`). The opacity trick dims content below AA contrast. | Extract one `OperationCard` (use the already-built `shared/operation-card.tsx`) and signal priority with color/badge/icon only, never opacity. |
| Medium | A3 | `customers/customers-list.tsx` vs `customers/customers-view.tsx` | Two divergent customer list UIs exist; the dead `customers-list.tsx` has different copy ("No customers" vs "No customers yet") and styling. | Delete the unused `customers-list.tsx`; keep `customers-view.tsx` as the single source. |
| Medium | A4 | `fleet/fleet-list.tsx`, `operations/operations-dashboard.tsx`, `inspections/inspections-list.tsx`, `inspections/inspection-card.tsx` | All four are dead code (no importers). Duplicate implementations drift silently. | Remove them (or wire `inspections-list` in) so future edits can't fork the design. |
| Low | A5 | `fleet/[id]/page.tsx:202-213` | "Maintenance" tab renders an `EmptyState` (full-width, centered, py-16) inside a `flex justify-between` next to a button — awkward split layout. | Give maintenance a real tab body; button should sit in the CardHeader row, not beside a centered empty state. |
| Low | A6 | `reservations/[id]/preparation/page.tsx:26-40` | Third `statusColors`+`statusLabels` pair for reservation statuses (also in `reservation-card`, `events-entry`), each slightly different. | One shared `status`→`{label,color}` config module (see C2). |

### B. Spacing & Rhythm

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| Medium | B1 | `components/shared/sidebar.tsx:56` vs `:83` | Work links `py-2.5`, management links `py-2` — a 2px row-height inconsistency in the same nav. | Single shared link class (`py-2.5`) for both groups. |
| Medium | B2 | `components/shared/page-header.tsx:5` (`px-4 pt-4 pb-3`) vs every list view's own wrapper `px-4 py-4 lg:px-6` | Two competing horizontal paddings stack on every list page (header `px-4`, content `px-4 lg:px-6` → `lg:px-6` under `lg:px-6`, `px-4` under `px-4`). Content aligns only by coincidence. | Decide one content gutter token (e.g. `px-4 lg:px-6`) and use it in both `PageHeader` and view wrappers. |
| Medium | B3 | `events/events-list.tsx:131` | Sticky date header uses `lg:top-14` (56px) but the desktop `(app)` layout has **no top bar** (sidebar is full-height, `app-shell.tsx` has no top padding) → the sticky header floats 56px down with dead space above it. | Use `top-0` on desktop too (remove `lg:top-14`). |
| Low | B4 | `fleet/fleet-view.tsx:139` + `customers/customers-view.tsx:92` + `reservations/reservations-content.tsx:48` | All use `pb-20 lg:pb-6` for bottom-nav clearance — correct, but `operations`/`settings` use `pb-8`/`pb-20 lg:pb-6` inconsistently (`operations-view.tsx:213`). | Standardize the content-bottom padding token across all seven list views. |

### C. Typography

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| High | C1 | `components/ui/card.tsx:41`, `dialog.tsx:125`, `sheet.tsx:108` | `font-heading` is applied to CardTitle/DialogTitle/SheetTitle but `--font-heading` is **never defined** in `globals.css` (only `--font-sans`/`--font-mono`). The utility is a silent no-op — headings rely on weight alone. | Define `--font-heading` (or a `--font-heading` token) so card/dialog titles get the intended display face; or remove `font-heading`. |
| High | C2 | System-wide `text-[10px]` / `text-[11px]` micro-type: `sidebar.tsx:45,72`, `section-header.tsx:6`, `operations-view.tsx:228`, `operations-dashboard.tsx:30`, `reservations-content.tsx:57,66,75`, `inspections-view.tsx:85,94,103,113,129`, `nav-bar.tsx:31`, `events-entry.tsx:88,92`, `search-bar.tsx:48`, `command-palette-wrapper.tsx:23` | The UI leans on 10–11px text for labels, timestamps, stat captions, and nav — below comfortable legibility and directly against the README's "five-second clarity + sunlight on a phone" constraint. | Bump micro-labels to `text-xs` (12px) minimum; use a `text-xs text-muted-foreground` convention everywhere 10/11px appears. |
| Medium | C3 | `operations/operations-view.tsx:226` | Revenue stat is `font-mono text-2xl font-bold` with a currency+number (e.g. `IDR 1.234.567`) in a `grid-cols-2` (mobile) card — overflow/truncation risk. | Add `truncate`, `text-balance`, or scale down to `text-xl` inside the 2-col grid. |
| Positive | — | `fleet/fleet-view.tsx:237`, `customers/customers-view.tsx:158`, `search-bar.tsx:65,71` | `font-mono` for plates/phones/odometers + `tabular-nums` for stats is strong, domain-correct typography. Keep. | — |

### D. Color / Theming

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| High | D1 | Raw palette status colors, duplicated in 8 places: `fleet/vehicle-card.tsx:7-12`, `fleet/fleet-view.tsx:28-33`, `fleet/[id]/page.tsx:61-66`, `reservations/reservation-card.tsx:8-13`, `rental-card.tsx:8-12`, `inquiry-card.tsx:8-12`, `reservations/[id]/preparation/page.tsx:26-32`, `events/events-entry.tsx:30-37` | Each file re-declares `statusColors` with `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` etc. — but `globals.css` **already defines semantic `--success`/`--warning` tokens** (used correctly by `status-chip.tsx`). Total token-system drift: same status renders differently depending on which component drew it. | Centralize one `status` → `{bg,text,icon,label}` map (start from `status-chip.tsx`), extend it to cover Rented/Maintenance/Confirmed/Preparing/Overdue/etc., and replace all 8 raw maps. |
| High | D2 | Raw `*-500` text on `*-500/10` backgrounds fails contrast on light mode: `events/events-entry.tsx:11-27` (iconMap `text-amber-500` etc.), `operations/operations-view.tsx:140-147` (typeConfig), `inspections/inspections-view.tsx:80-81,89-90,152-153,190-191`, `reservations/reservations-content.tsx:52-53,61-62,70-71`, `settings/settings-view.tsx:70-71,100-101` | On a white card, `text-amber-500` ≈ 2.2:1, `text-emerald-500` ≈ 3.4:1 — both fail WCAG AA 4.5:1. The `-600 light`/`-400 dark` pattern used elsewhere is fine; these files mix it. | Use `*-600 dark:*-400` everywhere `*-500` text touches a near-white 10% tint; verify with a contrast checker. |
| Medium | D3 | `operations/operations-view.tsx:228`, `operations-dashboard.tsx:30` | Trend/sub-labels use `text-[10px] text-muted-foreground/60` — ~2.8:1 effective contrast. | Drop `/60`; use plain `text-muted-foreground` (or `text-muted-foreground/80` minimum). |
| Medium | D4 | `customers/[id]/page.tsx:110` | Hardcoded WhatsApp green `text-[#25D366]`. | Add a `--color-whatsapp` token (or reuse `success`) so dark mode gets a correct variant. |
| Medium | D5 | `shared/operation-card.tsx:26-29` | Uses `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500` and `bg-blue-100` — raw scale, inconsistent with the `-500/10` convention everywhere else. | Convert to the shared `success`/`warning`/`destructive` token pattern. |
| Low | D6 | `fleet/vehicle-card.tsx:18` | `bg-gradient-to-br from-primary/20 to-primary/5` is the only gradient accent in the app. | Either adopt a `--gradient-primary` token and use it for all avatar tiles, or flatten to `bg-primary/10` for consistency. |

### E. Motion

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| High | E1 | `globals.css` (whole file) + `app-shell.tsx:12` | **No `prefers-reduced-motion` handling anywhere.** Staggered `animate-fade-up`/`slide-up`/`scale-in` (delays up to 280ms, `globals.css:162-169`) and infinite `shimmer`/`pulse` run for users with vestibular sensitivity; `tw-animate-css` ships its own. | Add a global reduced-motion override (e.g. `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`) and drop stagger delays when reduced. |
| Medium | E2 | `fleet/vehicle-card.tsx:16`, `operations/operations-view.tsx:305,344,383` | `hover:scale-[1.01]` on cards — layout-affecting transform with no motion guard; on touch it does nothing (dead affordance). | Replace with `hover:ring-1 hover:ring-ring` or a translate-y on the chevron; keep layout stable. |
| Medium | E3 | `components/shared/loading-skeleton.tsx:4,10-16,23-29` | `animate-shimmer` (1.5s infinite linear) and `animate-pulse` in views run on every load; shimmer uses a full-width gradient repaint. | Use the cheaper `animate-pulse` as default and reserve shimmer for hero/heroic placeholders; honor reduced-motion. |
| Low | E4 | `operations/operations-view.tsx:166` | `now = useMemo(() => new Date(), [])` freezes "today" at mount — buckets go stale if the page stays open past midnight. | Compute `now` per render or with a 60s interval. |

### F. Accessibility

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| Critical | F1 | Whole `(app)` + `shared` tree (grep: **0 `aria-label` hits**) | Not a single `aria-label`/`aria-labelledby` in the audited tree. Icon-only controls are unnameable: fleet filter (`fleet-view.tsx:151-153`), all three FABs (`fleet-view.tsx:284-290`, `reservations-content.tsx:169-176`, `customers/[id]:232-237`), collapse toggle when collapsed (`sidebar.tsx:99-106` — icon only), photo-remove button (`file-upload.tsx:50-58`), dialog close uses `sr-only` (good — `dialog.tsx:75`). | Add `aria-label` to every icon-only control; keep the `sr-only` pattern for dialog close. Add an axe/Playwright a11y assertion to CI. |
| High | F2 | `fleet/fleet-view.tsx:231`, `customers/customers-view.tsx:146`, `inspections/inspections-view.tsx:198`, `operations/operations-view.tsx:302-309,341-347,380-386` | Rows/cards navigate via `onClick` on non-interactive elements (`<tr>`, `<Card>` = `<div>`) — not focusable, no Enter/Space activation, no `role`. Keyboard users cannot open any record. | Make rows keyboard-activatable: `role="button"`/`tabIndex={0}` + `onKeyDown` Enter/Space, or wrap the primary cell in a real `<Link>`. |
| High | F3 | `components/shared/error-banner.tsx` (built, used **nowhere**) + all list/detail views | Fetch errors render as empty data: `fleet-view.tsx:124` ("No vehicles yet"), `customers-view.tsx:79`, `inspections-view.tsx:63`, `reservations-content` tabs, `events-list.tsx:94`. A network failure looks like an empty fleet — silent data loss for staff. | Surface query `isError` with `ErrorBanner` (+ Retry) before falling through to empty states. |
| High | F4 | `settings/settings-view.tsx:110-132` | Three `Switch` rows have visible text but no label association (`for`/`aria-labelledby`); screen readers announce anonymous "switch, unchecked". | Wrap each row so the Switch is labelled by its visible text, or add `aria-label`. |
| Medium | F5 | `reservations/start-rental-dialog.tsx:33`, `complete-rental-dialog.tsx:33` | `<Label>` has no `htmlFor` and the `<Input>` has no `id` → unlabeled odometer inputs. (`add-vehicle-dialog` does it right — copy that pattern.) | Add matching `htmlFor`/`id`. |
| Medium | F6 | `components/shared/search-bar.tsx:57` | Search input is placeholder-only, no label; overlay (`:53`) has no `role="dialog"`/`aria-modal`. | Add `aria-label="Search"` to the input and `role="dialog" aria-modal="true" aria-label="Search"` to the overlay. |
| Medium | F7 | `reservations/new-inquiry-dialog.tsx:92-114,165-178` | Native `<select>` (Vehicle) has no accessible label (the `<Label>` has no `htmlFor`, select has no `id`). Also the raw shadcn `Select` component exists and is unused here — styling drift. | Use `components/ui/select` (base-ui) with proper `aria-labelledby`, or add `htmlFor`/`id`. |
| Medium | F8 | `operations/operations-view.tsx:383` | `opacity-75` on info cards drops content text below contrast. | Remove the opacity; use the outline badge to signal "info". |
| Medium | F9 | `customers/[id]/page.tsx:107-115` | WhatsApp button opens `wa.me` in a new tab via `window.open` — no `rel="noopener"` concern (window.open is fine), but no announcement that it's a new tab. | `aria-label="Message {customerName} on WhatsApp"` + `aria-haspopup="dialog"` if it ever becomes an in-app composer. |
| Positive | — | `globals.css:100-103`, `button.tsx:7`, `input.tsx:12`, `dialog.tsx:56,75` | Global `:focus-visible` ring + `focus-visible:ring-3` on all primitives + `sr-only` dialog close = a solid focus/announcement baseline. Keep and extend to rows (F2). | — |

### G. Mobile Responsiveness

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| Critical | G1 | `components/shared/command-palette-wrapper.tsx:15` vs `fleet/fleet-view.tsx:285`, `reservations/reservations-content.tsx:170`, `customers/[id]/page.tsx:232` | Global ⌘K pill is `fixed bottom-20 right-4 z-50`; the page FABs are `fixed bottom-20 right-4` (and `lg:bottom-6`). They occupy the **same corner at every breakpoint**; the pill (z-50) covers the FABs, burying "Add Vehicle"/"New Inquiry". | Move the pill: bottom nav area above the FAB (`bottom-32`), left-aligned, or fold the command palette into the mobile bottom nav. |
| High | G2 | Touch targets < 44px throughout: default `Button h-8` (32px, `button.tsx:23`), `size="sm" h-7` (28px), `xs h-6` (24px); filter chips `py-2` ≈ 36px (`fleet-view.tsx:163`, `operations-view.tsx:243`, `events-list.tsx:115`); sort buttons `h-8`; inspection type/status segcontrols `py-1` ≈ 28px (`inspections-view.tsx:119,134`); default `Input h-8` (`input.tsx:12`) | Interactive elements are well under the 44px thumb target the README's one-handed constraint demands. | On mobile use `h-11` (44px) min for buttons/inputs/segcontrols; keep `h-8` only for desktop (`md:h-8`). |
| Medium | G3 | `fleet/fleet-view.tsx:265-282` | When a status filter yields zero vehicles, the mobile list renders nothing (no fallback), while `customers-view.tsx:191-194` correctly shows "No customers match your search". | Add the same "No vehicles match" fallback. |
| Medium | G4 | `reservations/reservations-content.tsx:50-78`, `inspections/inspections-view.tsx:78-106` | Stat groups are icon+number+label pairs in a non-wrapping `flex gap-6` — on narrow phones 3 stats + gutters can overflow/scrunch labels. | Allow wrap (`flex-wrap`) or use a `grid grid-cols-3`. |
| Medium | G5 | `components/shared/nav-bar.tsx:22-24` | 7 destinations in one `h-14` row — labels ("Ops", "Resv", "Insp", "Cust") are cryptic abbreviations at `text-[11px]`. | Keep 5 items max on mobile and move Settings to a header overflow menu; or widen to 7 items with icon-only + `aria-label` (F1). |
| Low | G6 | `fleet/fleet-view.tsx:284-290` | FAB `size-14` (56px) — good. But `rounded-2xl` vs `rounded-full` in `fleet-list.tsx:33` — the two dead/duplicate components have different FAB shapes. | One FAB style token app-wide. |

### H. Empty States

| Severity | # | Location | Finding | Recommendation |
|---|---|---|---|---|
| High | H1 | `customers/customers-view.tsx:79-88` | Empty customers has **no action** and the customers list page has no FAB — a dead end. The copy ("Customer contacts will appear when you create inquiries") implies there's nothing to do, but staff may want to add a customer proactively. | Add an `action` (e.g. "Add Customer" opening a create dialog) or at minimum a hint + link to New Inquiry. |
| Medium | H2 | `inspections/inspections-view.tsx:63-72`, `events/events-list.tsx:94-103` | Empty states have no action even where one is sensible (e.g. inspections → "Start Inspection"). | Add a contextual primary action when a plausible one exists. |
| Low | H3 | `components/shared/empty-state.tsx:12-13` | The icon is the same generic hollow circle for every context — no visual signal of what's empty. | Accept an `icon` prop and pick per-context icons (Car/Calendar/Camera), keeping the circle-mono aesthetic. |
| Positive | — | `empty-state.tsx:15-16`, `fleet/fleet-view.tsx:127-131`, `operations/operations-view.tsx:417-423` | Titles and descriptions are human and specific ("All clear for today", "No vehicles yet — add your first vehicle…"), and most states include an action. This is the pattern to standardize on (H1/H2 aside). | — |

---

## Patterns & Systemic Issues

1. **Status-color token drift (8 files).** Same statuses render with different raw palette colors per file while `globals.css` already ships `--success`/`--warning`/`--destructive` tokens that only `status-chip.tsx` and a few Badge usages honor. Consolidate into one `status` config module.
2. **Dead interactive controls (6).** `fleet-view.tsx:151` (filter icon), `fleet/[id]/page.tsx:208` (Schedule Maintenance), `customers/[id]/page.tsx:233` (New Inquiry FAB), `settings/settings-view.tsx:63` (Save Changes), `operations-view.tsx:324/363/402` (ghost action buttons). Users tap controls that do nothing — undermines trust in the whole workspace.
3. **Silent error handling.** `ErrorBanner` exists but is never imported; all 7 list views map error→empty-state. A flaky-mobile-network staff user (the core persona) gets false "no data" screens.
4. **Duplicate view components (4 unused files)** — `fleet-list`, `customers-list`, `operations-dashboard`, `inspections-list`/`inspection-card`. Forking implementations = silent design divergence.
5. **Micro-type at 10–11px** used as a default for captions/labels — a systemic legibility choice that fights the product's own mobile-in-sunlight constraint.

## Positive Findings (keep & replicate)

- **Mobile-first shell:** fixed bottom nav (h-14), thumb-zone FABs (56px), `pb-20 lg:pb-6` clearance, `md:pl-[72px]` NavRail — genuinely built for one hand.
- **Focus management baseline:** global `:focus-visible` ring + `ring-3` on every base-ui primitive; dialog close has `sr-only` text.
- **Domain typography:** mono for plates/phones/odometers, `tabular-nums` for figures — fast scannability.
- **Card elevation via `ring-1 ring-foreground/10`** (not heavy shadows) — clean, flat, consistent.
- **`SidebarContext` + `AppShell` padding transition** — collapse/expand is smooth and correctly persisted.
- **Human empty-state copy** and **timeline rail with sticky date headers** (modulo B3) are the right patterns.

---

## Recommended Actions (priority order)

1. **[P0] `/impeccable adapt`**: Resolve the ⌘K pill ↔ FAB overlap (G1) and keyboard-activatable rows (F2); shrink touch targets guidance for mobile (G2).
2. **[P0] `/impeccable layout`**: Single content-gutter token (B2), bottom-padding standardization (B4), sticky-header fix (B3), sidebar link rhythm (B1).
3. **[P1] `/impeccable clarify`**: Wire `ErrorBanner` into every view's `isError` (F3), fix dead buttons (Patterns #2), add missing empty-state actions (H1/H2).
4. **[P1] `/impeccable colorize`**: Consolidate the 8 status-color maps into the `success`/`warning`/`destructive` tokens (D1), fix `*-500`-on-tint contrast (D2) and `/60` opacities (D3).
5. **[P1] `/impeccable typeset`**: Kill the 10/11px micro-type system (C2), define `--font-heading` or drop `font-heading` (C1).
6. **[P2] `/impeccable harden`**: `prefers-reduced-motion` + stagger guard (E1), input labels for dialogs (F5/F7), switch labels (F4), `aria-label`s for all icon-only controls (F1), replace `<img>` with `next/image` (Perf).
7. **[P2] `/impeccable distill`**: Remove dead components (A3/A4), dedupe the 3-copy OperationsView card render (A2).
8. **[P2] `/impeccable polish`**: Final pass over micro-details once the above land (opacity-75, fleet empty-filter fallback, FAB radius token, WhatsApp token).

> **Note:** `settings/settings-view.tsx` is a known hardcoded/stubbed business card (dead Save button, static `defaultValue`s, uncontrolled switches, literal `"IDR"` stub in `customers/[id]` total-spent). These are **explicitly owned by plan todo 10** (settings rewrite) — no action required in todo 11 for the settings stub itself, but the label/contrast patterns it demonstrates are folded into F1–F4 above.
