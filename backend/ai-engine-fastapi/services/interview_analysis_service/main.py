from __future__ import annotations

from fastapi import FastAPI

from common.schemas import HealthResponse, InterviewAnalysisRequest, InterviewAnalysisResponse
from common.text_utils import sentence_count

app = FastAPI(title='Interview Analysis Service', version='1.0.0')

POSITIVE_TERMS = {'ownership', 'deliver', 'collaborate', 'impact', 'improve', 'lead', 'learn'}
NEGATIVE_TERMS = {'cannot', 'unable', 'delay', 'conflict', 'issue', 'problem'}
BIAS_TERMS = {'gender', 'male only', 'female only', 'married', 'age limit'}


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='interview_analysis_service')


def analyze(payload: InterviewAnalysisRequest) -> InterviewAnalysisResponse:
    text = payload.transcript.lower()
    tokens = text.split()

    positive_hits = sum(1 for token in tokens if token in POSITIVE_TERMS)
    negative_hits = sum(1 for token in tokens if token in NEGATIVE_TERMS)

    sentiment_raw = positive_hits - negative_hits
    sentiment_score = max(0.0, min(100.0, 50.0 + sentiment_raw * 6.0))

    sentence_cnt = max(sentence_count(payload.transcript), 1)
    avg_sentence_length = len(tokens) / sentence_cnt
    communication_score = max(30.0, min(100.0, 70.0 + (avg_sentence_length - 10.0) * 1.8))

    confidence_score = max(25.0, min(100.0, 55.0 + positive_hits * 4.0))
    culture_fit_score = max(20.0, min(100.0, 60.0 + (positive_hits - negative_hits) * 3.0))

    bias_flags = [term for term in BIAS_TERMS if term in text]

    final_score = (communication_score * 0.35) + (confidence_score * 0.25) + (sentiment_score * 0.2) + (culture_fit_score * 0.2)
    recommendation = 'proceed'
    if final_score < 55 or bias_flags:
        recommendation = 'manual_review'
    if final_score < 40:
        recommendation = 'reject'

    summary = (
        f'Interview analyzed with communication score {communication_score:.1f}, '
        f'confidence score {confidence_score:.1f}, and culture fit {culture_fit_score:.1f}.'
    )

    return InterviewAnalysisResponse(
        interview_id=payload.interview_id,
        communication_score=round(communication_score, 2),
        confidence_score=round(confidence_score, 2),
        sentiment_score=round(sentiment_score, 2),
        culture_fit_score=round(culture_fit_score, 2),
        recommendation=recommendation,
        summary=summary,
        bias_flags=bias_flags,
    )


@app.post('/v1/interview/analyze', response_model=InterviewAnalysisResponse)
def analyze_interview(payload: InterviewAnalysisRequest) -> InterviewAnalysisResponse:
    return analyze(payload)


@app.post('/v1/interview/analyze/batch', response_model=list[InterviewAnalysisResponse])
def analyze_batch(payloads: list[InterviewAnalysisRequest]) -> list[InterviewAnalysisResponse]:
    return [analyze(payload) for payload in payloads]
