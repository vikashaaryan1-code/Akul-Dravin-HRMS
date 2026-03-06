# AI Engine Architecture

## Microservices

1. `resume_parser_service` (`:8001`)
2. `candidate_matching_service` (`:8002`)
3. `interview_analysis_service` (`:8003`)
4. `workforce_analytics_service` (`:8004`)
5. `attrition_prediction_service` (`:8005`)
6. `hr_assistant_service` (`:8006`)
7. `orchestrator_service` (`:9000`) for composite AI workflows

## Data & Model Flow

1. Raw exports land in `data/raw`.
2. `training_data_pipeline` cleans + feature-engineers into `data/training`.
3. `ml_pipeline` trains models and stores artifacts under `models/registry`.
4. Services load artifacts through `common/model_registry.py`.
5. Services expose FastAPI endpoints for inference.
6. Orchestrator combines service outputs for end-to-end workflows.

## Core AI Workflows

- Resume Parse -> Matching -> Interview Analysis -> Hire Recommendation
- Workforce Forecast -> Attrition Risk -> Retention Actions
- HR Assistant Q&A -> Policy Grounding -> Suggested Actions
