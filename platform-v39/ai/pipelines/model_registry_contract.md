# Model Registry Contract

## Model Metadata
- `model_key`
- `model_domain`
- `model_type`
- `owner_team`
- `tenant_scope` (global or tenant-specific)

## Version Metadata
- `version_label`
- `artifact_uri`
- `training_data_window`
- `metrics`
- `fairness_report_uri`
- `drift_thresholds`
- `deployment_status`

## Release States
- `staging`
- `active`
- `retired`
- `failed`

## Deployment Gates
1. Metric threshold pass.
2. Fairness audit pass.
3. Security scan pass.
4. Human approval for high-impact models.
