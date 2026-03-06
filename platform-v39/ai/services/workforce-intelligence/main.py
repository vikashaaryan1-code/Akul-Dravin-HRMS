from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="Workforce Intelligence Service", version="39.0.0")

class ForecastRequest(BaseModel):
    context: Dict[str, Any]

@app.get('/health')
def health():
    return {"service": "workforce-intelligence", "status": "ok"}

@app.post('/forecast')
def forecast(req: ForecastRequest):
    return {
        "headcount_forecast": [],
        "skill_gap_alerts": [],
        "attrition_risk_summary": {},
    }
