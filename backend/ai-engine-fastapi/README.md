# Akul Dravin HRMS AI Engine (FastAPI)

This workspace implements AI engine architecture for:

- Resume parsing
- Candidate-job matching
- Interview analysis
- Workforce analytics
- Attrition prediction
- AI HR assistant chatbot

It also includes:

- AI orchestration service
- Training data pipeline
- ML training/evaluation pipeline

## 1) AI Microservices

| Service | Port | Purpose |
|---|---:|---|
| Resume Parsing | 8001 | Extract candidate profile from resumes |
| Candidate Matching | 8002 | Score/rank candidates for jobs |
| Interview Analysis | 8003 | Analyze transcript and interview quality |
| Workforce Analytics | 8004 | Demand forecast, skill gap, productivity alerts |
| Attrition Prediction | 8005 | Employee attrition risk prediction |
| HR Assistant | 8006 | Policy Q&A and summary assistant |
| Orchestrator | 9000 | Composite AI workflows |

## 2) API Endpoints

Detailed route map: `docs/api-endpoints.md`
Payload examples: `docs/request-examples.md`

Core orchestrator routes:
- `POST /v1/ai/hiring-intelligence`
- `POST /v1/ai/workforce-intelligence`

## 3) ML Pipeline

Files:
- `ml_pipeline/train_attrition_model.py`
- `ml_pipeline/train_matching_model.py`
- `ml_pipeline/train_all.py`
- `ml_pipeline/evaluate_models.py`

## 4) Training Data Pipeline

Files:
- `training_data_pipeline/ingest.py`
- `training_data_pipeline/clean.py`
- `training_data_pipeline/feature_engineering.py`
- `training_data_pipeline/build_training_dataset.py`

Pipeline flow:
1. Place raw CSV exports in `data/raw`
2. Build training data: `python -m training_data_pipeline.build_training_dataset`
3. Train models: `python -m ml_pipeline.train_all`
4. Evaluate model registry: `python -m ml_pipeline.evaluate_models`

## 5) Run Services

Install:
```bash
cd backend/ai-engine-fastapi
pip install -r requirements.txt
```

Run one service:
```bash
uvicorn services.resume_parser_service.main:app --port 8001 --reload
```

Run all (Docker):
```bash
docker compose -f docker-compose.ai.yml up --build
```

## 6) Files to start with

- Architecture: `docs/ai-architecture.md`
- Shared schemas: `common/schemas.py`
- Microservices: `services/*/main.py`
- Pipelines: `training_data_pipeline/*`, `ml_pipeline/*`
