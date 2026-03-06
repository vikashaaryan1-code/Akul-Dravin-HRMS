from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="Attrition Prediction Service", version="39.0.0")

class AttritionRequest(BaseModel):
    employee_features: Dict[str, Any]

@app.get('/health')
def health():
    return {"service": "attrition-prediction", "status": "ok"}

@app.post('/predict')
def predict(req: AttritionRequest):
    return {
        "attrition_probability": 0.0,
        "risk_band": "low",
        "explanations": [],
    }
