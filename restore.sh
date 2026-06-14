#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# POSTGRES RESTORE SCRIPT — Akul Dravin HRMS
# ═══════════════════════════════════════════════════════════════════════════════
# Restores a pg_dump backup file to target database.
# Usage: bash restore.sh <backup_file_or_s3_path>
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup_file_or_s3_path>"
  echo "  Example (local):  $0 /opt/hrms/backups/hrms_production_20260515T020000Z.dump"
  echo "  Example (S3):     $0 s3://your-bucket/hrms-backups/hrms_production_20260515T020000Z.dump"
  exit 1
fi

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-hrms}"
DB_NAME="${POSTGRES_DB:-hrms_production}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
TIMESTAMP=$(date -u '+%Y%m%dT%H%M%SZ')
LOCAL_FILE="$BACKUP_FILE"

log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

notify() {
  local status="$1" msg="$2"
  [[ -n "$SLACK_WEBHOOK" ]] && curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "{\"text\":\"[RESTORE] ${status}: ${msg}\"}" >/dev/null 2>&1 || true
}

log "═══════════════════════════════════════"
log "RESTORE STARTED"
log "  source: ${BACKUP_FILE}"
log "  target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
log "═══════════════════════════════════════"

# ── Download from S3 if needed ───────────────────────────────────────────────
if [[ "$BACKUP_FILE" == s3://* ]]; then
  LOCAL_FILE="/tmp/hrms_restore_${TIMESTAMP}.dump"
  log "Downloading from S3..."
  aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
  log "Downloaded to ${LOCAL_FILE}"
fi

# ── Decrypt if GPG-encrypted ─────────────────────────────────────────────────
if [[ "$LOCAL_FILE" == *.gpg ]]; then
  DECRYPTED="${LOCAL_FILE%.gpg}"
  log "Decrypting backup..."
  gpg --output "$DECRYPTED" --decrypt "$LOCAL_FILE"
  LOCAL_FILE="$DECRYPTED"
  log "Decrypted to ${LOCAL_FILE}"
fi

# ── Safety confirmation ──────────────────────────────────────────────────────
echo ""
echo "⚠️  WARNING: This will RESTORE ${DB_NAME} from $(basename "$BACKUP_FILE")"
echo "   All current data will be REPLACED."
echo ""
read -rp "Type 'RESTORE-NOW' to confirm: " CONFIRM
if [[ "$CONFIRM" != "RESTORE-NOW" ]]; then
  log "Restore aborted by user."
  exit 1
fi

# ── Pre-restore backup ───────────────────────────────────────────────────────
log "Creating pre-restore safety backup..."
export PGPASSWORD="$DB_PASSWORD"
SAFETY_BACKUP="/tmp/hrms_pre_restore_safety_${TIMESTAMP}.dump"
pg_dump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --format=custom --compress=9 \
  --file="$SAFETY_BACKUP" 2>/dev/null || true
log "Safety backup saved: ${SAFETY_BACKUP}"

# ── Drop + Recreate ──────────────────────────────────────────────────────────
log "Dropping and recreating database ${DB_NAME}..."
psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
  postgres
dropdb  --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "$DB_NAME" --if-exists
createdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "$DB_NAME"

# ── Restore ───────────────────────────────────────────────────────────────────
log "Restoring from ${LOCAL_FILE}..."
pg_restore \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --no-acl --no-owner \
  --jobs=4 \
  --verbose \
  "$LOCAL_FILE"

unset PGPASSWORD

log "═══════════════════════════════════════"
log "RESTORE COMPLETE"
log "  Safety backup kept at: ${SAFETY_BACKUP}"
log "  If restore was incorrect, run this script with the safety backup."
log "═══════════════════════════════════════"

notify "SUCCESS" "Restore complete from $(basename "$BACKUP_FILE") → ${DB_NAME}"
