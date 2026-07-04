# ═══════════════════════════════════════════════════════════════════════════
# AKUL DRAVIN HRMS AI — Frontend (Next.js 15)
# Multi-stage production Dockerfile with security hardening
# ═══════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependency installer ─────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env vars (non-secret, baked into bundle)
ARG NEXT_PUBLIC_SITE_URL=https://hrms.akuldravin.com
ARG NEXT_PUBLIC_APP_NAME="Akul Dravin HRMS"
ARG NEXT_PUBLIC_API_URL=https://api.hrms.akuldravin.com

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Leverage standalone output for minimal image (set output:'standalone' in next.config)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — Next.js built-in health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
