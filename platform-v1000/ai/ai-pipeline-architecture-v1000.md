# AI Pipeline Architecture (v1000.0)

## AI service portfolio
- 250+ models grouped into:
  - Workforce risk models (attrition, burnout, absenteeism).
  - Talent models (resume parsing, matching, hiring probability).
  - Performance and compensation models (target forecast, salary prediction).
  - Security models (fraud/anomaly/access risk).
  - NLP assistant models (policy Q&A, multilingual support).

## Microservices
- `ai-resume-parser`
- `ai-matching-engine`
- `ai-interview-intelligence`
- `ai-workforce-forecast`
- `ai-compensation-forecast`
- `ai-anomaly-fraud`
- `ai-assistant-chat`
- `ai-feature-service`
- `ai-model-registry-gateway`

## End-to-end ML lifecycle
1. Data ingestion
- Pull from HRMS, ATS, payroll, attendance, surveys, engagement events.

2. Data quality and governance
- Schema checks, missing value policies, PII masking, consent filters.

3. Feature engineering
- Offline feature pipelines to feature store.
- Online feature serving with low-latency cache.

4. Training and validation
- Scheduled and event-triggered retraining.
- Cross-validation, fairness and drift baseline checks.

5. Registry and deployment
- Model artifact registry with lineage and approval workflow.
- Canary releases with shadow traffic.

6. Inference
- Real-time REST inference.
- Batch scoring jobs for monthly planning.

7. Monitoring
- Data drift, concept drift, latency, cost, and confidence tracking.
- Auto-retraining triggers based on threshold policies.

## Model governance
- Human override required for high-impact decisions.
- Explainability artifacts for scoring endpoints.
- Audit logs for model version, features, and decision outputs.

## Reference APIs
- `POST /api/v1/ai/resume/parse`
- `POST /api/v1/ai/matching/candidate-job`
- `POST /api/v1/ai/interview/analyze`
- `POST /api/v1/ai/workforce/attrition/predict`
- `POST /api/v1/ai/payroll/target-forecast`
- `POST /api/v1/ai/anomaly/detect`
- `POST /api/v1/ai/assistant/chat`
