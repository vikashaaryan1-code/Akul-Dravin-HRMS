from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="AI Orchestrator", version="39.0.0")

SERVICE_MAP = {
    "resume_parser": "resume-parser",
    "candidate_matching": "candidate-matching",
    "interview_analysis": "interview-analysis",
    "emotion_ai": "emotion-ai",
    "workforce_intelligence": "workforce-intelligence",
    "attrition_prediction": "attrition-prediction",
    "hr_assistant": "hr-assistant",
    "voice_ai": "voice-ai",
}

class OrchestratorRequest(BaseModel):
    capability: str
    payload: Dict[str, Any]

@app.get('/health')
def health():
    return {"service": "orchestrator", "status": "ok", "version": "39.0.0"}

@app.post('/route')
def route(req: OrchestratorRequest):
    target = SERVICE_MAP.get(req.capability)
    if not target:
        return {"status": "error", "message": "Unknown capability"}
    return {
        "status": "accepted",
        "target_service": target,
        "note": "Integrate HTTP/gRPC client for runtime invocation",
    }
