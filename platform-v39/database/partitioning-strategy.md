# Partitioning Strategy (1B+ Records)

## Partitioned Tables
- `attendance_records` by month (`attendance_date`)
- `analytics_events` by month (`event_time`)
- `audit_logs` by month (`logged_at`)
- `ai_inference_logs` by month (`created_at`)
- `usage_meter_events` by month (`event_time`)
- `virtual_presence_events` by month (`event_time`)

## Retention
- Hot: 0-6 months (primary partitions, full indexing)
- Warm: 7-24 months (reduced index footprint)
- Cold: 25+ months (compressed archive tier)

## Indexing Rules
- Every partition has:
  - `(tenant_id, <time_column>)`
  - `(tenant_id, <entity_id>)` when applicable
  - GIN index on jsonb payload for analytics/audit logs

## Maintenance Jobs
- Monthly auto-partition creation for +12 months.
- Weekly index health check + bloat monitoring.
- Daily archival movement jobs for expired partitions.
- VACUUM/ANALYZE schedule aligned with ingestion load windows.

## Query Pattern Guidance
- All analytics queries must include `tenant_id` and time range.
- Use summary tables/materialized views for dashboard widgets.
- Avoid cross-partition full scans in live API paths.
