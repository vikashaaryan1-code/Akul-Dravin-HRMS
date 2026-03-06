from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Resume Parser Service", version="39.0.0")

class ResumeParseRequest(BaseModel):
    resume_text: str

@app.get('/health')
def health():
    return {"service": "resume-parser", "status": "ok"}

@app.post('/parse')
def parse_resume(req: ResumeParseRequest):
    tokens = req.resume_text.split()
    return {
        "skills": [],
        "experience_years": 0,
        "education": [],
        "token_count": len(tokens),
    }
