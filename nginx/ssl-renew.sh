#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SSL RENEWAL SCRIPT — Akul Dravin HRMS
# ═══════════════════════════════════════════════════════════════════════════════
# Renews SSL certificates via Certbot + reloads Nginx gracefully.
# Run manually or schedule via cron: 0 0 * * * /opt/hrms/ssl-renew.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

DOMAIN="${DOMAIN:-hrms.akuldravin.com}"
EMAIL="${CERTBOT_EMAIL:-devops@akuldravin.com}"
NGINX_CONTAINER="${NGINX_CONTAINER:-hrms-nginx}"
CERTBOT_DATA_DIR="${CERTBOT_DATA_DIR:-./secrets/certbot}"
LOG_FILE="/var/log/hrms-ssl-renew.log"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG_FILE"
}

notify_slack() {
  local status="$1" msg="$2"
  if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\":\"[SSL-RENEW] ${status}: ${msg} (domain: ${DOMAIN})\"}" \
      > /dev/null 2>&1 || true
  fi
}

log "═══════════════════════════════════════"
log "SSL RENEWAL STARTED — domain=${DOMAIN}"
log "═══════════════════════════════════════"

# ── Certbot availability check ──────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  log "ERROR: certbot not found. Installing via snap..."
  if command -v snap &>/dev/null; then
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
  elif command -v apt-get &>/dev/null; then
    apt-get update -qq && apt-get install -y certbot python3-certbot-nginx
  else
    log "FATAL: Cannot install certbot. Abort."
    notify_slack "FAILED" "certbot not available"
    exit 1
  fi
fi

# ── Pre-renewal check: is cert due? ─────────────────────────────────────────
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/cert.pem"
if [[ -f "$CERT_PATH" ]]; then
  DAYS_LEFT=$(openssl x509 -in "$CERT_PATH" -noout -checkend 2592000 2>/dev/null; echo $?)
  if [[ $DAYS_LEFT -eq 0 ]]; then
    log "Certificate is valid for >30 days. Skipping renewal."
    exit 0
  fi
  log "Certificate expires within 30 days. Proceeding with renewal."
fi

# ── Run Certbot ─────────────────────────────────────────────────────────────
if certbot renew \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --nginx \
    --deploy-hook "docker exec ${NGINX_CONTAINER} nginx -s reload || true" \
    2>&1 | tee -a "$LOG_FILE"; then
  log "Certbot renewal succeeded."
  notify_slack "SUCCESS" "SSL certificate renewed"
else
  CERTBOT_EXIT=$?
  # Exit code 1 from certbot = no renewal needed; this is not an error
  if [[ $CERTBOT_EXIT -eq 1 ]]; then
    log "Certbot: no renewal needed (exit 1 = cert still valid)."
    exit 0
  fi
  log "ERROR: Certbot failed with exit code ${CERTBOT_EXIT}."
  notify_slack "FAILED" "Certbot exited ${CERTBOT_EXIT}"
  exit $CERTBOT_EXIT
fi

# ── Reload Nginx ─────────────────────────────────────────────────────────────
log "Reloading Nginx container: ${NGINX_CONTAINER}"
if docker exec "$NGINX_CONTAINER" nginx -t 2>&1 | tee -a "$LOG_FILE"; then
  docker exec "$NGINX_CONTAINER" nginx -s reload
  log "Nginx reloaded successfully."
else
  log "ERROR: Nginx config test failed. Skipping reload."
  notify_slack "WARNING" "SSL renewed but Nginx reload failed — check config"
  exit 1
fi

log "═══════════════════════════════════════"
log "SSL RENEWAL COMPLETE"
log "═══════════════════════════════════════"
