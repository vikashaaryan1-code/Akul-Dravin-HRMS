#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# POSTGRES BACKUP SCRIPT — Akul Dravin HRMS
# ═══════════════════════════════════════════════════════════════════════════════
# Creates encrypted, timestamped PostgreSQL dumps with retention cleanup.
# Cron: 0 2 * * * /opt/hrms/backup.sh  (runs daily at 2 AM)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-hrms}"
DB_NAME="${POSTGRES_DB:-hrms_production}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

BACKUP_DIR="${BACKUP_DIR:-/opt/hrms/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"          # Optional: s3://your-bucket/hrms-backups
ENCRYPT_KEY="${BACKUP_ENCRYPT_KEY:-}"  # Optional: GPG key fingerprint
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

TIMESTAMP=$(date -u '+%Y%m%dT%H%M%SZ')
BACKUP_FILE="${BACKUP_DIR}/hrms_${DB_NAME}_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG_FILE"; }

notify() {
  local status="$1" msg="$2"
  [[ -n "$SLACK_WEBHOOK" ]] && curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "{\"text\":\"[BACKUP] ${status}: ${msg}\"}" >/dev/null 2>&1 || true
}

log "════════════════════════════════════"
log "BACKUP STARTED — db=${DB_NAME}"
log "════════════════════════════════════"

mkdir -p "$BACKUP_DIR"

# ── Dump ─────────────────────────────────────────────────────────────────────
export PGPASSWORD="$DB_PASSWORD"

log "Running pg_dump..."
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-acl \
  --no-owner \
  --compress=9 \
  --file="$BACKUP_FILE"

unset PGPASSWORD

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Dump complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── Encrypt (optional) ───────────────────────────────────────────────────────
if [[ -n "$ENCRYPT_KEY" ]]; then
  log "Encrypting with GPG key: ${ENCRYPT_KEY}"
  gpg --recipient "$ENCRYPT_KEY" --output "${BACKUP_FILE}.gpg" --encrypt "$BACKUP_FILE"
  rm -f "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gpg"
  log "Encryption complete: ${BACKUP_FILE}"
fi

# ── Upload to S3 (optional) ──────────────────────────────────────────────────
if [[ -n "$S3_BUCKET" ]]; then
  log "Uploading to ${S3_BUCKET}..."
  aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/$(basename "$BACKUP_FILE")" \
    --storage-class STANDARD_IA \
    --sse AES256
  log "S3 upload complete."
fi

# ── Retention cleanup ────────────────────────────────────────────────────────
log "Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "hrms_*.dump*" -mtime "+${RETENTION_DAYS}" -delete
REMAINING=$(find "$BACKUP_DIR" -name "hrms_*.dump*" | wc -l)
log "Retention cleanup done. ${REMAINING} backups retained."

# ── Verify backup integrity ──────────────────────────────────────────────────
if [[ "$BACKUP_FILE" != *.gpg ]]; then
  log "Verifying backup integrity..."
  if pg_restore --list "$BACKUP_FILE" >/dev/null 2>&1; then
    log "Integrity check PASSED."
  else
    log "WARNING: Integrity check failed. Backup may be corrupt!"
    notify "WARNING" "Backup ${BACKUP_FILE} failed integrity check"
  fi
fi

log "════════════════════════════════════"
log "BACKUP COMPLETE — file=${BACKUP_FILE} size=${BACKUP_SIZE}"
log "════════════════════════════════════"

notify "SUCCESS" "Backup complete: $(basename "$BACKUP_FILE") (${BACKUP_SIZE})"
