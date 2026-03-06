# Feature Definitions (v39)

## Entity Groups
- Employee features: tenure, attendance quality, compensation percentile, performance trend.
- Candidate features: skill vectors, experience depth, interview sentiment.
- Job features: skill graph, salary band, hiring urgency.
- Recruiter features: time-to-submit, quality score, success ratio.
- Company features: attrition baseline, growth rate, budget posture.

## Feature Store Keys
- `employee:{tenant_id}:{employee_id}`
- `candidate:{tenant_id}:{candidate_id}`
- `job:{tenant_id}:{job_id}`
- `recruiter:{tenant_id}:{recruiter_id}`

## Time Windowing
- Short: 7 days
- Medium: 30 days
- Long: 180 days

## Governance
- PII never stored as raw features.
- Data lineage attached to each feature snapshot.
- Feature contract versioned and backward compatible.
