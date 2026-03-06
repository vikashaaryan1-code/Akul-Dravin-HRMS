# 07. AI Model Architecture

## AI Platform Objective
Provide cross-functional intelligence across HR, sales, marketing, finance, operations, and security with 300+ production models.

## AI Service Stack
- Feature ingestion pipelines (batch + streaming).
- Central feature store (online/offline).
- Model registry with lineage and versioning.
- Realtime inference service (low latency APIs).
- Batch scoring service (daily/weekly jobs).
- Monitoring and drift detection service.
- Retraining orchestration pipeline.

## Model Families (Target 300+)
| Domain | Model Types | Target Count |
|---|---|---:|
| HR and Workforce | attrition, promotion, skill-gap, attendance anomalies | 70 |
| Recruitment | resume ranking, interview fit, offer acceptance | 40 |
| Sales and CRM | lead scoring, deal win probability, churn risk | 55 |
| Marketing | campaign CTR/CVR, segment propensity, budget optimization | 45 |
| Finance | revenue forecast, fraud detection, expense anomaly | 40 |
| Operations | task delay prediction, inventory demand, procurement risk | 35 |
| Security | access anomaly, insider risk, threat prioritization | 25 |
| **Total** |  | **310** |

## Core Prediction APIs
- `POST /ai/predictions/attrition`
- `POST /ai/predictions/performance`
- `POST /ai/predictions/sales-forecast`
- `POST /ai/predictions/revenue-forecast`
- `POST /ai/predictions/lead-score`
- `POST /ai/anomaly/fraud-detection`

## Feature Store Design
- Online store: Redis for low-latency serving.
- Offline store: Parquet/Data Lake + warehouse.
- Feature groups:
  - employee_behavior_features
  - payroll_compensation_features
  - sales_pipeline_features
  - campaign_performance_features
  - finance_transaction_features
  - support_ticket_features

## Model Lifecycle
1. Data extraction and feature engineering.
2. Training with experiment tracking.
3. Model evaluation and fairness checks.
4. Security and compliance validation.
5. Staging deployment and A/B testing.
6. Production promotion.
7. Drift/quality monitoring and auto-retrain trigger.

## Guardrails
- Bias and fairness checks for people-impacting models.
- Human-in-the-loop approval for sensitive decisions (promotion/termination/fraud block).
- Explainability logs retained for compliance.

## MLOps SLOs
- Realtime inference P95 < 120 ms.
- Batch pipeline completion before 06:00 tenant local time.
- Drift detection alert within 30 minutes.
- Auto rollback if live performance drops below threshold.
