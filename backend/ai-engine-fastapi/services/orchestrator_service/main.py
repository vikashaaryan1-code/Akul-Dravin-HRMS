from __future__ import annotations

from typing import Any

import httpx
from fastapi import FastAPI, HTTPException

from common.config import get_settings
from common.schemas import (
    CandidateProfile,
    HealthResponse,
    HiringIntelligenceRequest,
    HiringIntelligenceResponse,
    InterviewAnalysisRequest,
    WorkforceIntelligenceRequest,
    WorkforceIntelligenceResponse,
)

app = FastAPI(title='AI Orchestrator Service', version='1.0.0')
settings = get_settings()


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='orchestrator_service')


async def post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, json=payload)

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@app.post('/v1/ai/hiring-intelligence', response_model=HiringIntelligenceResponse)
async def hiring_intelligence(payload: HiringIntelligenceRequest) -> HiringIntelligenceResponse:
    resume_result = await post_json(f'{settings.resume_parser_url}/v1/resume/parse', payload.resume.model_dump())

    candidate = CandidateProfile(
        candidate_id=resume_result.get('candidate_id') or 'candidate-from-resume',
        skills=resume_result.get('skills', []),
        total_experience_years=resume_result.get('total_experience_years') or 0,
        preferred_locations=[payload.job.location] if payload.job.location else [],
        expected_ctc=payload.job.offered_ctc,
    )

    match_result = await post_json(
        f'{settings.matching_url}/v1/matching/score',
        {
            'candidate': candidate.model_dump(),
            'job': payload.job.model_dump(),
        },
    )

    interview_result = None
    if payload.transcript:
        interview_result = await post_json(
            f'{settings.interview_url}/v1/interview/analyze',
            InterviewAnalysisRequest(interview_id='generated-interview', transcript=payload.transcript).model_dump(),
        )

    final_recommendation = 'review'
    match_score = float(match_result.get('overall_score', 0))

    if interview_result:
        interview_reco = interview_result.get('recommendation', 'manual_review')
        if match_score >= 80 and interview_reco == 'proceed':
            final_recommendation = 'hire'
        elif match_score >= 60:
            final_recommendation = 'panel_review'
        else:
            final_recommendation = 'reject'
    else:
        if match_score >= 80:
            final_recommendation = 'interview'
        elif match_score >= 60:
            final_recommendation = 'screen'
        else:
            final_recommendation = 'reject'

    return HiringIntelligenceResponse(
        resume=resume_result,
        match=match_result,
        interview=interview_result,
        final_recommendation=final_recommendation,
    )


@app.post('/v1/ai/workforce-intelligence', response_model=WorkforceIntelligenceResponse)
async def workforce_intelligence(payload: WorkforceIntelligenceRequest) -> WorkforceIntelligenceResponse:
    forecast_result = await post_json(
        f'{settings.workforce_url}/v1/workforce/forecast/hiring-demand',
        payload.forecast.model_dump(),
    )

    batch_payload = {
        'employees': [item.model_dump() for item in payload.attrition_candidates],
    }
    attrition_result = await post_json(f'{settings.attrition_url}/v1/attrition/predict/batch', batch_payload)

    high_risk_count = len([item for item in attrition_result if item.get('risk_band') == 'high'])
    strategic_recommendations = [
        'Prioritize succession planning for high-risk teams.',
        'Launch retention check-ins for medium/high risk employees.',
        'Align hiring pipeline to forecasted attrition and growth demand.',
    ]

    if high_risk_count == 0:
        strategic_recommendations.insert(0, 'Attrition risk is currently stable; maintain regular engagement cadence.')

    return WorkforceIntelligenceResponse(
        forecast=forecast_result,
        attrition_risks=attrition_result,
        strategic_recommendations=strategic_recommendations,
    )
