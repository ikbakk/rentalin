# Rentalin Landing: Design System

The design system for `landing/`, the Astro marketing surface for Rentalin. This
document describes the system as it is built: every token, class, and component
name below exists in the source under `landing/src/`. It is a record of the
built world, not a proposal.

---

## 1. Thesis

The landing owns one idea: Rentalin is a vehicle rental operations platform
that feels like a Jakarta rental lot at dusk, industrial, electric, real. The
page is deliberately built in the neon-tropical-industrial register, a dark
indigo ground lit by neon amber and electric green, set in monospace industrial
type over a WebGL aurora. It refuses the category-default arrangement for a
software landing, the generic SaaS look of an equal-sized icon-heading-text
card grid on a purple gradient. Everything on the page, from the pipeline
artwork to the street-grid background, is drawn, coded, or composed in-house;
nothing relies on stock photography or a template.

## 2. Own World

Strip away the copy and the page is still recognizable from its materials
alone:

- A near-black, indigo-tinted ground (`--background`) with a raised card
  surface one step lighter.
- Neon amber (`--primary`) as the one warm authority color: CTAs, active
  trust dots, the badge pill, stage one and two of the flow.
- Electric green (`--accent`) as the secondary signal: stage three and four
  of the flow, the booking-link status dot.
- JetBrains Mono for every heading, mono label, section number, and the
  booking-link demo. Work Sans for body copy.
- A WebGL aurora haze, always-on behind the hero and bleeding in at the CTA
  top edge, plus faint radial color washes behind the flow section.
- Character-split headline reveals (GSAP) and word-level blur-to-clarity
  subheadline reveals (Motion).
- 3D tilt cards whose artwork is procedural SVG: tinted plates, blueprint
  corner brackets, ring-and-crosshair targets, a diagonal energy line, and a
  step-progress rail.
- A Jakarta street-grid background drawn from repeating CSS gradients,
  masked radially, in the Indonesia section.

## 3. Palette

All values are from `landing/src/styles/globals.css`. The palette is defined
under the `.dark` class and the page is dark-only: `:root { color-scheme: dark }`
in `globals.css`, and `Layout.astro` hard-codes `class="dark"` on `<html>`
with `lang="id"`. There is no light theme.

| Token | Value | Semantic role |
| --- | --- | --- |
| `--background` | `oklch(0.10 0.008 280)` | Near-black indigo-tinted ground. The page base. |
| `--foreground` | `oklch(0.92 0.002 280)` | Near-white text on the ground. |
| `--card` | `oklch(0.15 0.008 280)` | Raised panel surface, one step above background. Used for the Features description strip. |
| `--card-foreground` | `oklch(0.92 0.002 280)` | Text on card surfaces (same value as foreground). |
| `--primary` | `oklch(0.75 0.18 85)` | Neon amber. The action color: primary CTA fill, badge pill, stage 1-2 accents, focus ring. |
| `--primary-foreground` | `oklch(0.13 0.008 280)` | Dark ink placed on amber fills. |
| `--accent` | `oklch(0.70 0.20 145)` | Electric green. The secondary signal: stage 3-4 accents, live/status dots. |
| `--accent-foreground` | `oklch(0.13 0.008 280)` | Dark ink placed on green fills. |
| `--muted` | `oklch(0.18 0.008 280)` | Secondary fill surface (defined, used by shimmer utility). |
| `--muted-foreground` | `oklch(0.60 0.008 280)` | Secondary text: subheadlines, card descriptions, trust signals, footer. |
| `--border` | `oklch(0.24 0.008 280)` | Hairline outlines: outline buttons, card borders, the street-grid lines. |
| `--ring` | `oklch(0.75 0.18 85)` | Focus ring, identical to primary amber. |

The theme also maps three font tokens: `--font-sans` to `"Work Sans"`, and
`--font-mono` / `--font-heading` to `"JetBrains Mono"`. The global base layer
applies `border-border` to every element and `bg-background text-foreground
antialiased` to the body.

Two derived values live outside the tokens and are worth naming, both in
`OperationalFlow.astro`: the pipeline artwork uses `oklch(0.13 0.008 280)` as
its plate background, one step below `--card` for depth, and mirrors
`--primary`, `--accent`, and `--border` verbatim as SVG literals because
data-URI images cannot read CSS variables.

## 4. Typography

Two families, self-hosted in `landing/public/fonts/` and declared with
`@font-face` in `landing/src/styles/fonts.css`. No network requests at
runtime.

- **JetBrains Mono**, weights 400 and 700. Everything headings and industrial:
  H1/H2 headlines, the badge pill, stage names, feature titles, section
  numbers, and the booking-link demo.
- **Work Sans**, weights 400, 500, and 600. Body copy: subheadlines, card
  descriptions, proof descriptions, trust signals, footer.

Observed scale (class strings as they appear in the sections):

| Role | Classes | Used in |
| --- | --- | --- |
| Display headline | `text-4xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-tight` | Hero H1 ("The engine behind every rental.") |
| Section heading | `text-3xl lg:text-5xl font-heading font-bold tracking-tight` | OperationalFlow, Features, IndonesiaProof H2s |
| CTA headline | `text-4xl lg:text-6xl font-heading font-bold tracking-tight` | CTASection closing headline |
| Stage / feature heading | `font-heading text-lg font-bold` / `font-heading text-xl font-semibold` | Flow card h3s, feature titles |
| Body | `text-lg lg:text-xl`, `text-lg`, `text-sm`, `text-base` | Hero subheadline, section subheadlines, card and proof descriptions, booking-link demo (`text-sm sm:text-base`) |
| Mono label | `font-mono text-xs uppercase tracking-widest` | Badge pill, stage names |

Tracking: headlines use `tracking-tight`; mono labels use `tracking-widest`
and are uppercase; body text carries no tracking override.

Measure: section content sits in `max-w-6xl` containers, headings and
subheads are capped at `max-w-2xl` and centered, the hero H1 and CTA
headline at `max-w-4xl`, and proof descriptions at `max-w-xs` with
`text-pretty`. The hero subheadline is `max-w-2xl mx-auto`. Long display
lines wrap at these bounds rather than running full-bleed.

## 5. Motion language

Four authored motions, each with one job, plus CSS sequence utilities and an
IntersectionObserver reveal. The global `prefers-reduced-motion: reduce`
block in `globals.css` collapses CSS animation and transition durations to
`0.01ms` and sets `scroll-behavior: auto`; `IndonesiaProof` additionally
checks the media query in JavaScript and reveals its content immediately.

- **Aurora** (WebGL): atmosphere, always-on. `Aurora.tsx` renders an ogl
  full-screen triangle with a simplex-noise fragment shader that sweeps a
  three-stop color ramp horizontally. Used with `colorStops={['#5227FF',
  '#e6a817', '#22c55e']}` in the hero (full-viewport, behind a readability
  gradient) and at the CTA top edge (masked, `h-64 opacity-40`). The canvas
  is transparent and additive-blended; it animates on a requestAnimationFrame
  loop regardless of scroll. Defaults when props are omitted:
  `['#5227FF', '#7cff67', '#5227FF']`, `amplitude = 1.0`, `blend = 0.5`.
- **SplitText** (GSAP): entrance, character-level. `SplitText.tsx` splits
  the headline via the GSAP SplitText plugin and staggers characters in from
  `{ opacity: 0, y: 40 }` on a scroll trigger (`once: true`, trigger at 10%
  from top with `rootMargin -100px`). Defaults: `splitType 'chars'`, `delay
  50ms`, `duration 1.25s`, ease `power3.out`. It waits on
  `document.fonts.ready` so the split measures the webfont, and it cleans up
  its ScrollTrigger instances on unmount. All headlines on the page are
  SplitText reveals.
- **BlurText** (Motion): entrance, blur-to-clarity. `BlurText.tsx` reveals
  text per word (default `animateBy 'words'`) from
  `{ filter: 'blur(10px)', opacity: 0, y: -50 }` to `{ blur(0px), opacity: 1,
  y: 0 }` through an intermediate half-blur keyframe, fired by an
  IntersectionObserver at `threshold 0.1`. Default `delay 200ms`,
  `stepDuration 0.35s`, linear easing. Every subheadline on the page is a
  BlurText reveal.
- **TiltedCard** (Motion): interaction, 3D hover tilt. `TiltedCard.tsx`
  tracks the pointer over a `figure` with 800px perspective, drives
  `rotateX` / `rotateY` through springs (`damping 30, stiffness 100, mass 2`),
  and scales on enter. `rotateAmplitude` is varied per instance: the four
  flow stages use 12, 15, 13, and 17; the feature cards use 12. `scaleOnHover`
  is 1.05 in the flow and 1.02 in Features. A cursor-following tooltip is
  built in but disabled by the Astro wrapper.

CSS sequence reveals: the flow stages and feature cards enter with
`animate-fade-up` (250ms fade + 8px rise) combined with `stagger-1` through
`stagger-4` (0 / 40 / 80 / 120ms delays). `IndonesiaProof` runs its own
scroll reveal: children hold at the hidden frame with `animation-play-state:
paused` until an IntersectionObserver (`threshold 0.15`) adds
`is-revealed`, then play a 700ms `cubic-bezier(0.22, 1, 0.36, 1)` rise-scale
with the system stagger delays, the number landing first and the description
last. A `<noscript>` fallback runs the animations unconditionally.

## 6. Component library

React islands in `landing/src/components/`, each hydrating with `client:load`
through an Astro wrapper. `index.ts` re-exports the four `.tsx` originals.

| Component | Kind | Role / key behavior |
| --- | --- | --- |
| `Aurora.tsx` | React island (ogl) | Always-on WebGL atmosphere. Props: `colorStops`, `amplitude`, `blend`, `time`, `speed`. |
| `SplitText.tsx` | React island (GSAP) | Scroll-triggered character-split headline reveal. Props: `text`, `className`, `tag`, `splitType`, `delay`, `duration`, `ease`, `from`, `to`, `threshold`, `rootMargin`. |
| `BlurText.tsx` | React island (Motion) | Word-level blur-to-clarity subheadline reveal. Props: `text`, `className`, `animateBy`, `direction`, `delay`, `threshold`, `stepDuration`. |
| `TiltedCard.tsx` | React island (Motion) | 3D tilt-on-hover figure with spring physics. Props: `imageSrc`, `altText`, `containerHeight/Width`, `imageHeight/Width`, `scaleOnHover`, `rotateAmplitude`, `overlayContent`, `displayOverlayContent`. |
| `ClientAurora.astro` | Wrapper | Passes props through to Aurora with `client:load`. Defaults match the React component. |
| `ClientSplitText.astro` | Wrapper | Passes through `text`, `className`, `splitType`, `delay`, `duration` with `client:load`. |
| `ClientBlurText.astro` | Wrapper | Passes through `text`, `className`, `animateBy`, `direction`, `delay` with `client:load`. |
| `ClientTiltedCard.astro` | Wrapper | Passes image/card props with `client:load`. **Limitation:** Astro props cannot carry a ReactNode, so `overlayContent` and `displayOverlayContent` default to `false`, and `showMobileWarning` / `showTooltip` are off. The wrapper renders the bare image card; overlays are composed in Astro instead. |

Sections in `landing/src/sections/`, rendered in order by
`landing/src/pages/index.astro`:

- **Hero.astro**: full-viewport open (`min-h-dvh`, centered content). Layer 1:
  Aurora plus a readability gradient (`from-background/70 via-transparent
  to-background`). Layer 2: badge pill ("Operational tool, not a marketplace", mono, `border-primary/40 bg-background/40 text-primary`),
  SplitText H1, BlurText subheadline, two CTAs (solid `bg-primary` / outline
  `border-border hover:border-primary`, both to `/login`), and a trust-signal
  row of three claims each with an amber dot.
- **OperationalFlow.astro**: `id="operational-flow"`. The four-stage pipeline
  Inquiry, Reservation, Handover, Return as TiltedCards. Each card's artwork
  is a data-URI SVG composed from locked palette literals: tinted plate,
  corner brackets, ring-and-crosshair target, diagonal line, the stage's
  Lucide glyph, and a progress rail whose filled count carries sequence
  meaning. Stages 1-2 run on amber, 3-4 on green. `rotateAmplitude` varies
  (12/15/13/17). Cards enter with `animate-fade-up` + `stagger-1..4`. On
  mobile the cards stack over a vertical `from-primary via-accent` connector
  rail. Faint `bg-accent/5` and `bg-primary/5` radial washes sit behind the
  section.
- **Features.astro**: three features (Fleet Management, Inspection
  Checklists, Timeline Audit Trail), each a TiltedCard over a `/features/*.svg`
  illustration. Because the wrapper cannot pass `overlayContent`, the
  description strip is a solid `bg-card` panel over the image revealed by a
  CSS `group-hover` translate/opacity transition (`md:translate-y-2
  md:opacity-0 md:group-hover:*`), always visible on touch. Each card carries
  an accent line (`border-primary/40`, `border-accent/40`, `border-border`)
  and a Lucide icon in the matching channel.
- **IndonesiaProof.astro**: `id="indonesia"`. Three ordered proof points
  (01 Works offline, 02 One-handed use, 03 Sunlight-readable) with oversized
  `font-mono` numbers in alternating amber/green. Background is a Jakarta
  street-grid drawn from two repeating gradients, radially masked and held at
  `opacity-[0.35]`. Reveal is the IntersectionObserver sequence described
  above, with a reduced-motion and no-JS fallback.
- **CTASection.astro**: closing section. Aurora bleeds at the top edge only
  (`h-64 opacity-40`, masked by a gradient) so it never obscures the CTA.
  BlurText headline and subhead, then a booking-link demo
  (`your-brand.rentalin.id` in mono, `border-primary/40`, a 3s
  `link-glow` opacity pulse and a soft `--primary` shadow), two CTAs to
  `/login`, and a footer with the 2026 copyright line and links.

## 7. Bans

The guardrails this build actually honors:

- **No gradient text.** No `bg-clip-text` anywhere; headlines are solid
  `text-foreground` on the dark ground.
- **No glass-as-decoration.** The `.glass` utilities exist in `globals.css`
  but no section uses them. Surfaces are flat `--card` panels, not blurred
  translucency.
- **No Inter or Roboto.** The only fonts are JetBrains Mono (400/700) and
  Work Sans (400/500/600), self-hosted.
- **No equal-size icon-heading-text card grids.** The old Next.js landing is
  the explicit anti-reference. The flow stages differ in rotation, accent
  channel, bracket composition, and artwork; the feature cards are imagery
  with hover-revealed description strips.
- **No fake metrics or claims.** Trust signals and proof points trace to
  documented constraints (1-50 vehicles, three-tap, one-handed, offline,
  sunlight-readable). There is no "join 1000+ businesses", no fake urgency,
  no invented testimonials.
- **No section numbers without sequence meaning.** The only numerals on the
  page are the proof points 01/02/03, which are ordered and information-
  bearing.
- **Dark-only.** `color-scheme: dark` and a hard-coded `.dark` class on the
  root; there is no light theme and none is planned.

---

*Recorded from the built source. Token values cross-checked against
`landing/src/styles/globals.css`; section and component names cross-checked
against `landing/src/`.*
