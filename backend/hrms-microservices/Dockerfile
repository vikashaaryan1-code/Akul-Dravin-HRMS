# ── Stage 1: dependency install ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy manifests only (maximizes layer cache — only rebuilds on package changes)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Stage 3: production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security (principle of least privilege)
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

# Install only production dependencies
COPY package*.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy entrypoint (runs migrations before app start)
COPY --chown=nestjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nestjs

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:4001/api/v1/health || exit 1

# entrypoint runs migrations then execs node dist/main.js
ENTRYPOINT ["./entrypoint.sh"]

