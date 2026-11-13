# Rentalin visual system: Dispatch Sheet

The Astro landing and Next.js app share the **Dispatch Sheet** direction. The page should feel like a clear field document for an Indonesian rental shop: bright enough to read at a desk or in daylight, structured around the actual inquiry → reservation → handover → return workflow.

## Foundations

| Role | Value | Use |
| --- | --- | --- |
| Background | `#f1efe5` | Warm paper canvas |
| Foreground | `#222a20` | Main ink |
| Card | `#fffdf6` | Raised sheets and forms |
| Primary | `#1d422e` | Forest ink for actions, rules and active navigation |
| Accent | `#8c5b0b` | Amber ink for markers and secondary signals |
| Highlight | `#edbd58` | Underlines and small emphasis areas |
| Muted | `#e4e5d8` | Status plates and quiet surfaces |
| Muted foreground | `#5d655a` | Supporting copy |
| Border | `#c8c8b9` | Document rules |

The same role names and values appear in `landing/src/styles/globals.css` and `frontend/src/app/globals.css`. The app adds semantic success, warning, and destructive colors for operational states.

**Type:** Work Sans for headings, body, controls and brand; JetBrains Mono for step numbers, IDs, plates and data labels. Both are self-hosted in each app's `public/fonts/` directory. Headings use a tight measure and generous size; data stays tabular and precise.

**Layout:** Use editorial columns and ruled lists. A white sheet on the paper ground is the main raised surface. The hero dispatch sheet is explicitly illustrative; its states show the product's real workflow, not fabricated business data. Use sequence numbers only for the four rental stages or other real ordered steps.

**Icons and ornament:** Lucide line icons identify the four workflow stages, three feature areas, and three field-use proof points. They use a consistent 1.6–1.8 stroke in forest ink or amber. The custom `public/ornaments/rental-lot-route.svg` draws parking bays and a four-stop route from the product's actual process; it is decorative, stays behind the closing CTA, and has empty alternative text. Keep icons supportive of labels and reserve large artwork for product-specific diagrams.

**Motion:** Scroll smoothing uses Lenis in the landing and Next.js app. Anchor links work, nested app scroll areas remain usable, and reduced-motion preferences are honored. Interactions use brief color changes and maintain visible default content.

**Use:** Forest for the primary action. Amber marks a key phrase or process position. Green success and amber warning in the app convey operational status. Keep links and focus visible, body text readable, and controls large enough for touch. The public booking pages and authenticated workspace use the same palette and type without hiding each business's own name or vehicle information.
