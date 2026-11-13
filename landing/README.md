# Rentalin landing

The Astro marketing site serves `/` in production. The Next.js app in `frontend/` serves login, public booking links and the workspace. The visual system shared by both is documented in [DESIGN.md](DESIGN.md).

## Local development

```bash
cd landing
cp .env.example .env
# Set PUBLIC_APP_URL to the public app origin and PUBLIC_WHATSAPP_NUMBER to the demo contact.
npm ci
npm run dev
```

The default port is 4321; Astro prints another port if it is occupied. The landing uses Lenis for smooth scrolling and the same self-hosted fonts as the app.

## Release

```bash
npm run test:release-env
npm run build
npm run start
```

`npm run build` validates `PUBLIC_APP_URL` and `PUBLIC_WHATSAPP_NUMBER`, then writes the standalone server to `dist/`. Docker Compose runs the `landing` service on port 4321 behind nginx. nginx routes `/` and `/_astro/` to this service and sends other paths to the Next.js app.

## Page composition

`src/pages/index.astro` assembles Hero, OperationalFlow, Features, IndonesiaProof and CTASection. The hero shows an illustrative dispatch sheet; the following sections explain the real four-stage workflow, fleet and inspection tools, field use, and the demo action. Styles and tokens live in `src/styles/globals.css`.

Lucide icons mark workflow and feature concepts. The closing section uses a hand-authored parking-lot route SVG from `public/ornaments/`.
