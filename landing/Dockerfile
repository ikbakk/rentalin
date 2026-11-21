# syntax=docker/dockerfile:1

FROM oven/bun:1.4.4-alpine AS base
RUN addgroup -g 1001 -S rentalin && adduser -S rentalin -G rentalin
WORKDIR /app

FROM base AS build
ARG PUBLIC_APP_URL
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ARG PUBLIC_WHATSAPP_NUMBER
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS final
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build --chown=rentalin:rentalin /app/dist ./dist
COPY --from=build --chown=rentalin:rentalin /app/node_modules ./node_modules
COPY --from=build --chown=rentalin:rentalin /app/package.json ./package.json
USER rentalin
EXPOSE 4321
CMD ["bun", "run", "dist/server/entry.mjs"]
