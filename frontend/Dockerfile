FROM node:22-alpine AS base
RUN addgroup -g 1001 -S rentalin && adduser -S rentalin -G rentalin
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS final
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps --chown=rentalin:rentalin /app/node_modules ./node_modules
COPY --from=build --chown=rentalin:rentalin /app/.next ./.next
COPY --from=build --chown=rentalin:rentalin /app/public ./public
COPY --chown=rentalin:rentalin package.json next.config.ts ./

USER rentalin
EXPOSE 3000
CMD ["npx", "next", "start"]
