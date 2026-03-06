from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="HR Assistant Service", version="39.0.0")

class ChatRequest(BaseModel):
    message: str
    language: str = 'en'

@app.get('/health')
def health():
    return {"service": "hr-assistant", "status": "ok"}

@app.post('/respond')
def respond(req: ChatRequest):
    return {
        "answer": "Policy-aware response placeholder",
        "language": req.language,
        "actions": [],
    }
