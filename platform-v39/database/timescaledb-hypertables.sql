-- TimescaleDB extension layer for high-volume time-series domains

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert partition-heavy event tables to hypertables where operationally preferred.
-- Run only in Timescale-enabled clusters.

SELECT create_hypertable('platform.analytics_events', 'event_time', if_not_exists => TRUE, migrate_data => TRUE);
SELECT create_hypertable('platform.audit_logs', 'logged_at', if_not_exists => TRUE, migrate_data => TRUE);
SELECT create_hypertable('platform.ai_inference_logs', 'created_at', if_not_exists => TRUE, migrate_data => TRUE);
SELECT create_hypertable('platform.usage_meter_events', 'event_time', if_not_exists => TRUE, migrate_data => TRUE);
SELECT create_hypertable('platform.virtual_presence_events', 'event_time', if_not_exists => TRUE, migrate_data => TRUE);

-- Compression policies (example)
ALTER TABLE platform.analytics_events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'tenant_id,event_name'
);
SELECT add_compression_policy('platform.analytics_events', INTERVAL '30 days');

ALTER TABLE platform.ai_inference_logs SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'tenant_id,inference_type'
);
SELECT add_compression_policy('platform.ai_inference_logs', INTERVAL '14 days');
