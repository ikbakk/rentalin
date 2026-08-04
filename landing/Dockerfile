# syntax=docker/dockerfile:1

# ---------- base: shared user + workdir ----------
FROM node:22-alpine AS base
RUN addgroup -g 1001 -S rentalin && adduser -S rentalin -G rentalin
WORKDIR /app

# ---------- build: npm ci (full, incl. devDeps for astro build) + astro build ----------
FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- final: node runtime for @astrojs/node standalone server ----------
FROM base AS final
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build --chown=rentalin:rentalin /app/dist ./dist
COPY --from=build --chown=rentalin:rentalin /app/node_modules ./node_modules

USER rentalin
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
