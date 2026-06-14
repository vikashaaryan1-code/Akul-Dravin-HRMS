#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-dev-certs.sh
# Generates self-signed SSL certs for local HTTPS development with Nginx.
# For production: use Let's Encrypt (certbot) instead.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CERT_DIR="./nginx/certs"
mkdir -p "$CERT_DIR"

echo "[CERTS] Generating self-signed certificate for local development..."

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/self-signed.key" \
  -out "$CERT_DIR/self-signed.crt" \
  -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=AkulDravin/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:app.akuldravin.com,IP:127.0.0.1"

echo "[CERTS] Self-signed certificate generated at: $CERT_DIR/"
echo "[CERTS] NOTE: Browsers will show a security warning — this is expected for self-signed certs."
echo "[CERTS] For production, replace with Let's Encrypt certs via certbot."
