#!/bin/sh
# ── Docker entrypoint ─────────────────────────────────────────────────────────
# Single schema authority: TypeORM migrations ONLY.
# schema.sql is NOT executed here — it is a reference document only.
# Fail-fast on migration error so Docker restarts before the app boots broken.
set -e

echo "[entrypoint] Running TypeORM migrations..."

# Use the compiled datasource — no ts-node required in production image.
node -e "
const { AppDataSource } = require('./dist/database/datasource');
AppDataSource.initialize()
  .then(ds => ds.runMigrations({ transaction: 'all' }))
  .then(applied => {
    console.log('[entrypoint] Migrations applied:', applied.length);
    applied.forEach(m => console.log('  ✓', m.name));
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[entrypoint] Migration FAILED:', err.message);
    process.exit(1);
  });
"

echo "[entrypoint] Starting NestJS application..."
# exec replaces the shell — Docker SIGTERM goes directly to node
exec node dist/main.js

