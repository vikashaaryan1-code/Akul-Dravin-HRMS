# AI Architecture - AKUL DRAVIN v39

## AI Microservices
- `orchestrator`: request routing, policy checks, model selection.
- `resume-parser`: CV extraction and normalization.
- `candidate-matching`: skill and fit scoring.
- `interview-analysis`: transcript/behavior scoring.
- `emotion-ai`: emotion distribution and bias controls.
- `workforce-intelligence`: demand forecast, productivity trends.
- `attrition-prediction`: churn risk probability.
- `hr-assistant`: policy-aware conversational assistant.
- `voice-ai`: speech-to-intent and response handling.

## Model Portfolio Target
- 200+ models in registry
- 50+ neural network models
- Remaining: gradient boosting, linear, ranking, graph, and rule models

## ML Pipeline
1. Data ingestion (events, HRMS, ERP, ATS, feedback)
2. Data quality checks + PII policy enforcement
3. Feature computation and feature store snapshots
4. Training and hyperparameter search
5. Evaluation, fairness and drift baselines
6. Model registration and staged rollout
7. Online inference and monitoring
8. Human override and feedback capture
9. Continuous retraining

## Compliance Controls
- Explainability payload attached to high-impact recommendations.
- Human override mandatory for promotion, compensation, termination.
- Bias review gates before model activation.
- Immutable inference logs for audit.
