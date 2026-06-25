# syntax=docker/dockerfile:1
# Backend (Express 5) — multi-stage. Debian slim so bcrypt/native modules build cleanly
# on both x86 and Oracle Ampere ARM.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Build toolchain for native deps (bcrypt) in case no prebuilt binary exists for the arch.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m appuser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 8080
CMD ["node", "server.js"]
