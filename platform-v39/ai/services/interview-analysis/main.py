from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Interview Analysis Service", version="39.0.0")

class InterviewRequest(BaseModel):
    transcript: str

@app.get('/health')
def health():
    return {"service": "interview-analysis", "status": "ok"}

@app.post('/analyze')
def analyze(req: InterviewRequest):
    length = len(req.transcript.split())
    return {
        "communication_score": min(length / 10, 100),
        "clarity_score": 0,
        "recommendation": "hold",
    }
