FROM node:22-slim AS builder

RUN apt-get update -qq && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline=false

COPY . .
RUN npm run build

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM node:22-slim

RUN apt-get update -qq && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Prisma schema + migrations for migrate deploy
COPY --from=builder /app/node_modules/.bin/prisma         ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma              ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma             ./node_modules/@prisma
COPY --from=builder /app/prisma                           ./prisma
COPY --from=builder /app/prisma.config.ts                 ./prisma.config.ts
COPY --from=builder /app/package.json                     ./package.json

# Copy standalone server
COPY --from=builder /app/.next/standalone                 ./
COPY --from=builder /app/.next/static                     ./.next/static
COPY --from=builder /app/public                           ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD node_modules/.bin/prisma migrate deploy && node server.js
