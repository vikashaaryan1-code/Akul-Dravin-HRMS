from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="Emotion AI Service", version="39.0.0")

class EmotionRequest(BaseModel):
    text: str

@app.get('/health')
def health():
    return {"service": "emotion-ai", "status": "ok"}

@app.post('/detect')
def detect(req: EmotionRequest):
    return {
        "emotions": {
            "neutral": 1.0,
            "positive": 0.0,
            "negative": 0.0,
        },
        "risk_flags": [],
    }
