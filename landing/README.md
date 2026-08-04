# Rentalin Landing

**The Rentalin marketing surface: a standalone Astro site serving `/` in production.**

Rentalin's landing page is its own Astro project in `landing/`, built in the Neon-Tropical Industrial direction (dark base, neon amber and electric green accents, industrial mono headings, WebGL atmosphere). It is a sibling to the Next.js app in `frontend/`; the two never share code. The frontend app keeps its own routes (`/login`, `/r/*`, `/booking/*`, the authenticated workspace), and in production nginx hands the site root over to this project.

This file is operational: how to run, build, and deploy the landing. The design system behind it lives in `DESIGN.md`.

---

## Development

```bash
cd landing
npm install
npm run dev
# → http://localhost:4321
```

In development the landing runs standalone on port 4321 via the Astro dev server, no nginx or other services needed. The Next.js app keeps running on its own port; nginx only routes `/` to the landing in production.

## Production build

```bash
npm run build     # astro build → dist/
npm run start     # node dist/server/entry.mjs
# → http://localhost:4321
```

`npm run build` runs `astro build`, writing to `dist/`. The config sets `output: 'server'` with the `@astrojs/node` adapter in `standalone` mode, so `npm run start` boots a real Node server (`dist/server/entry.mjs`) that serves both the HTML and the hashed `/_astro/` bundles. No separate static file server is required.

The same thing inside Docker, from the repo root:

```bash
docker compose up -d landing
```

The multi-stage `landing/Dockerfile` (node:22-alpine) installs with `npm ci`, runs `npm run build`, then serves `dist/server/entry.mjs` on port 4321 with `HOST=0.0.0.0`.

## Deployment

The landing is one of four services in the root `docker-compose.yml`:

| Service | Container | Internal port | Published |
|---------|-----------|---------------|-----------|
| `backend` | `rentalin-api` | 5000 | No |
| `frontend` | `rentalin-frontend` | 3000 | No |
| `landing` | `rentalin-landing` | 4321 | No |
| `nginx` | `rentalin-nginx` | 80/443 | Yes |

nginx is the only public entry point. The routing in `nginx/nginx.conf`:

- `location = /` → `landing:4321` (exact root match)
- `location /_astro/` → `landing:4321` (Astro's hashed static assets)
- `location /` (catch-all) → `frontend:3000` (login, booking links, workspace, API)

So `/` and the landing's assets come from this project, and everything else falls through to the Next.js app. The `landing` service joins the `rentalin_net` bridge network and has a healthcheck (HTTP GET on 4321); its port is never published to the host.

## Project structure

```
landing/
├── astro.config.mjs          # output: 'server', @astrojs/node standalone, port 4321
├── Dockerfile                # multi-stage build (node:22-alpine)
├── public/
│   ├── fonts/                # self-hosted webfonts (5 × .woff2)
│   └── features/             # SVG artwork (fleet, inspection, timeline)
└── src/
    ├── pages/
    │   └── index.astro       # assembles the 5 sections in order
    ├── layouts/
    │   └── Layout.astro      # html shell, loads globals.css + fonts.css
    ├── sections/
    │   ├── Hero.astro            # Aurora backdrop, SplitText headline, BlurText subheadline, CTAs
    │   ├── OperationalFlow.astro # 4-step pipeline: Inquiry → Reservation → Handover → Return
    │   ├── Features.astro        # 3 TiltedCards: fleet, inspections, timeline
    │   ├── IndonesiaProof.astro  # offline / one-handed / sunlight proof points
    │   └── CTASection.astro      # closing CTA + personalized link demo
    ├── components/
    │   ├── Aurora.tsx        # WebGL animated backdrop (ogl)
    │   ├── SplitText.tsx     # character-level text reveal (GSAP)
    │   ├── BlurText.tsx      # blur-to-clarity reveal (motion)
    │   ├── TiltedCard.tsx    # 3D hover tilt (motion)
    │   ├── Client*.astro     # island wrappers (client:load) around each .tsx
    │   └── index.ts          # re-exports
    └── styles/
        ├── globals.css       # Tailwind v4, OKLCH design tokens, animations
        └── fonts.css         # @font-face declarations
```

`src/pages/index.astro` renders the sections top to bottom: Hero, OperationalFlow, Features, IndonesiaProof, CTASection. The four animation components are React islands hydrated with `client:load`; everything else ships as static HTML with zero client JavaScript.

## Fonts

| Family | Weights | Role |
|--------|---------|------|
| JetBrains Mono | 400, 700 | Headings, industrial mono labels |
| Work Sans | 400, 500, 600 | Body copy |

Both families are self-hosted as woff2 in `public/fonts/` and declared with `@font-face` in `src/styles/fonts.css`. They are sourced from Google Fonts and licensed under the SIL Open Font License (OFL). Because the files ship inside the bundle, the page never makes a network request for fonts at runtime.

## Stack

| Package | Version |
|---------|---------|
| Astro | 5.x |
| @astrojs/node | 9.x (standalone SSR) |
| @astrojs/react | 4.x |
| tailwindcss / @tailwindcss/vite | 4.x |
| react / react-dom | 19.2.4 |
| gsap / @gsap/react | 3.15 / 2.1.2 |
| motion | 12.43 |
| ogl | 1.0.11 |
| lucide-react | 1.27 |
| typescript | 5.x |
