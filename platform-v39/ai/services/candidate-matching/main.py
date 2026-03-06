from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Candidate Matching Service", version="39.0.0")

class MatchRequest(BaseModel):
    candidate_skills: List[str]
    job_skills: List[str]

@app.get('/health')
def health():
    return {"service": "candidate-matching", "status": "ok"}

@app.post('/score')
def score(req: MatchRequest):
    overlap = len(set(req.candidate_skills).intersection(set(req.job_skills)))
    base = max(len(req.job_skills), 1)
    return {"match_score": round((overlap / base) * 100, 2)}
