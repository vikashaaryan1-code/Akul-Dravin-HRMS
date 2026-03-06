from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Voice AI Service", version="39.0.0")

class VoiceRequest(BaseModel):
    transcript: str

@app.get('/health')
def health():
    return {"service": "voice-ai", "status": "ok"}

@app.post('/process')
def process(req: VoiceRequest):
    return {
        "intent": "unknown",
        "entities": {},
        "response": "Voice response placeholder",
    }
