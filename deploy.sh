#!/usr/bin/env bash
# =============================================================================
# Akul Dravin HRMS — Production Deploy Script
# Usage: ./deploy.sh [--fresh] [--no-migrate] [--no-seed]
# =============================================================================
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Flags ─────────────────────────────────────────────────────────────────────
FRESH=false; NO_MIGRATE=false; NO_SEED=false
for arg in "$@"; do
  case $arg in
    --fresh)       FRESH=true ;;
    --no-migrate)  NO_MIGRATE=true ;;
    --no-seed)     NO_SEED=true ;;
  esac
done

# ── Pre-flight checks ─────────────────────────────────────────────────────────
log "Running pre-flight checks..."

command -v docker >/dev/null 2>&1      || err "Docker is not installed."
command -v docker-compose >/dev/null 2>&1 || err "docker-compose is not installed."

[[ -f ".env" ]]                         || err ".env file missing. Copy .env.example and fill in values."
[[ -f "secrets/db_password.txt" ]]      || err "secrets/db_password.txt missing. Create it with your DB password."
[[ -f "nginx/default.conf" ]]           || err "nginx/default.conf missing."

# Check critical env vars
source .env
[[ -z "${JWT_SECRET:-}" ]] && err "JWT_SECRET is not set in .env"
[[ "${JWT_SECRET}" == *"change"* ]] && warn "JWT_SECRET still contains 'change' — update it for production!"

log "Pre-flight checks passed ✓"

# ── Optional: fresh start ─────────────────────────────────────────────────────
if [[ "$FRESH" == true ]]; then
  warn "Fresh mode: removing all containers and volumes..."
  docker-compose down -v --remove-orphans 2>/dev/null || true
fi

# ── Build images ──────────────────────────────────────────────────────────────
log "Building Docker images..."
docker-compose build --no-cache

# ── Start infrastructure services first ──────────────────────────────────────
log "Starting Postgres + Redis..."
docker-compose up -d postgres redis

log "Waiting for Postgres to be healthy..."
until docker-compose exec -T postgres pg_isready -U postgres -d akul_dravin_hrms >/dev/null 2>&1; do
  echo -n "."
  sleep 2
done
echo ""
log "Postgres is ready ✓"

# ── Run migrations ────────────────────────────────────────────────────────────
if [[ "$NO_MIGRATE" == false ]]; then
  log "Running database migrations..."
  docker-compose run --rm backend sh -c "npm run migration:run" || {
    warn "Migration failed. Check migration files."
    err "Aborting deploy — database not ready."
  }
  log "Migrations complete ✓"
else
  warn "--no-migrate flag set. Skipping migrations."
fi

# ── Seed (dev only) ───────────────────────────────────────────────────────────
if [[ "$NO_SEED" == false && "${NODE_ENV:-production}" != "production" ]]; then
  log "Running seed data..."
  docker-compose run --rm backend sh -c "npm run seed" || warn "Seed failed (non-fatal)."
fi

# ── Start all services ────────────────────────────────────────────────────────
log "Starting all services (backend, frontend, nginx)..."
docker-compose up -d

# ── Wait for health checks ────────────────────────────────────────────────────
log "Waiting for services to pass health checks..."
sleep 15

BACKEND_OK=false
FRONTEND_OK=false

for i in {1..12}; do
  if docker-compose exec -T backend curl -fsS http://localhost:4001/api/v1/health >/dev/null 2>&1; then
    BACKEND_OK=true; break
  fi
  echo -n "."
  sleep 5
done
echo ""

for i in {1..6}; do
  if docker-compose exec -T frontend curl -fsS http://localhost:3000/ >/dev/null 2>&1; then
    FRONTEND_OK=true; break
  fi
  echo -n "."
  sleep 5
done
echo ""

# ── Deploy summary ────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AKUL DRAVIN HRMS — DEPLOY SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[[ "$BACKEND_OK"  == true ]] && echo -e "  Backend  : ${GREEN}✓ HEALTHY${NC}  http://localhost:4001" \
                              || echo -e "  Backend  : ${RED}✗ NOT READY${NC} — check: docker-compose logs backend"
[[ "$FRONTEND_OK" == true ]] && echo -e "  Frontend : ${GREEN}✓ HEALTHY${NC}  http://localhost:3000" \
                              || echo -e "  Frontend : ${RED}✗ NOT READY${NC} — check: docker-compose logs frontend"
echo -e "  Nginx    : http://localhost (port 80) | https://localhost (port 443)"
echo -e "  DB Admin : postgres://localhost:5432/akul_dravin_hrms"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$BACKEND_OK" == false || "$FRONTEND_OK" == false ]]; then
  warn "Some services are not healthy. Check logs with: docker-compose logs"
  exit 1
fi

log "🚀 Deployment complete! System is LIVE."
