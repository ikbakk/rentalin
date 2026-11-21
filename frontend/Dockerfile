# Build from the repository root: frontend imports the shared Convex API/types.
FROM oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/package.json frontend/bun.lock ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY convex ./convex
COPY frontend ./frontend
WORKDIR /app/frontend
ARG NEXT_PUBLIC_CONVEX_URL
ARG CONVEX_SITE_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV CONVEX_SITE_URL=${CONVEX_SITE_URL}
ENV NEXT_PUBLIC_FRONTEND_URL=${NEXT_PUBLIC_FRONTEND_URL}
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1.4.4-alpine AS final
RUN addgroup -g 1001 -S rentalin && adduser -S rentalin -G rentalin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=rentalin:rentalin /app/node_modules ./node_modules
COPY --from=build --chown=rentalin:rentalin /app/frontend/node_modules ./frontend/node_modules
COPY --from=build --chown=rentalin:rentalin /app/frontend/.next ./frontend/.next
COPY --from=build --chown=rentalin:rentalin /app/frontend/public ./frontend/public
COPY --from=build --chown=rentalin:rentalin /app/frontend/package.json /app/frontend/next.config.ts ./frontend/
WORKDIR /app/frontend
USER rentalin
EXPOSE 3000
CMD ["bun", "run", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"]
