# AI Engine Architecture (v1000.0)

## 1. AI microservice groups
- `ai-resume-parser`: OCR, entity extraction, skill normalization.
- `ai-matching`: candidate-job semantic matching and ranking.
- `ai-interview-analysis`: transcript scoring and communication analytics.
- `ai-workforce-forecast`: hiring demand, attrition, capacity planning.
- `ai-anomaly-fraud`: payroll/attendance anomaly and fraud signals.
- `ai-assistant`: multilingual HR copilot and policy Q&A.

## 2. Platform components
- Feature store for online/offline feature parity.
- Model registry with approval workflow and lineage.
- Inference gateway with model routing and A/B versioning.
- Monitoring for drift, bias, latency, and data quality.

## 3. ML lifecycle
1. Data ingestion from OLTP, ATS, attendance, payroll, and support events.
2. Data validation and privacy filtering.
3. Feature engineering and dataset versioning.
4. Training and hyperparameter tuning.
5. Evaluation with fairness and explainability checks.
6. Registry approval and canary deployment.
7. Production monitoring and auto-retraining triggers.

## 4. API families
- `/api/v1/ai/resume/parse`
- `/api/v1/ai/matching/candidate-job`
- `/api/v1/ai/interview/analyze`
- `/api/v1/ai/workforce/attrition/predict`
- `/api/v1/ai/workforce/hiring-forecast/predict`
- `/api/v1/ai/assistant/chat`

## 5. Human-in-the-loop policy
- AI outputs are recommendations by default.
- High-impact decisions require explicit human approval.
- Every override is logged for model feedback loops.
