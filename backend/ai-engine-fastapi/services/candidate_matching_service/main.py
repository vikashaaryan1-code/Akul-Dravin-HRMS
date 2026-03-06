from __future__ import annotations

from fastapi import FastAPI

from common.config import get_settings
from common.features import jaccard_similarity, numeric_score, safe_float, weighted_score
from common.schemas import (
    HealthResponse,
    MatchScoreResponse,
    MatchingRequest,
    RankCandidatesRequest,
    RankCandidatesResponse,
)

app = FastAPI(title='Candidate Matching Service', version='1.0.0')
settings = get_settings()


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='candidate_matching_service')


def score_candidate(candidate, job) -> MatchScoreResponse:
    skill_match = jaccard_similarity(candidate.skills, job.required_skills)

    experience_ratio = numeric_score(
        safe_float(candidate.total_experience_years),
        safe_float(job.min_experience_years),
        safe_float(job.min_experience_years) + 8.0,
    )

    location_score = 0.0
    if job.location:
        normalized_location = job.location.lower()
        location_score = 1.0 if any(normalized_location in loc.lower() for loc in candidate.preferred_locations) else 0.4
    else:
        location_score = 0.7

    salary_score = 0.8
    if candidate.expected_ctc and job.offered_ctc:
        gap_ratio = abs(candidate.expected_ctc - job.offered_ctc) / max(job.offered_ctc, 1.0)
        salary_score = max(0.0, 1.0 - gap_ratio)

    overall = weighted_score(
        {
            'skill_match': (skill_match, 0.45),
            'experience': (experience_ratio, 0.25),
            'location': (location_score, 0.15),
            'salary': (salary_score, 0.15),
        }
    )

    overall_percent = round(overall * 100, 2)
    if overall_percent >= 80:
        recommendation = 'strong_recommend'
    elif overall_percent >= 60:
        recommendation = 'recommend_with_review'
    else:
        recommendation = 'low_fit'

    return MatchScoreResponse(
        candidate_id=candidate.candidate_id,
        job_id=job.job_id,
        overall_score=overall_percent,
        breakdown={
            'skill_match': round(skill_match * 100, 2),
            'experience_score': round(experience_ratio * 100, 2),
            'location_score': round(location_score * 100, 2),
            'salary_score': round(salary_score * 100, 2),
        },
        recommendation=recommendation,
    )


@app.post('/v1/matching/score', response_model=MatchScoreResponse)
def matching_score(payload: MatchingRequest) -> MatchScoreResponse:
    return score_candidate(payload.candidate, payload.job)


@app.post('/v1/matching/rank', response_model=RankCandidatesResponse)
def matching_rank(payload: RankCandidatesRequest) -> RankCandidatesResponse:
    top_k = payload.top_k if payload.top_k > 0 else settings.default_top_k
    scored = [score_candidate(candidate, payload.job) for candidate in payload.candidates]
    ranked = sorted(scored, key=lambda item: item.overall_score, reverse=True)[:top_k]
    return RankCandidatesResponse(job_id=payload.job.job_id, ranked_candidates=ranked)


@app.post('/v1/matching/explain', response_model=dict)
def matching_explain(payload: MatchingRequest) -> dict:
    scored = score_candidate(payload.candidate, payload.job)
    return {
        'candidate_id': scored.candidate_id,
        'job_id': scored.job_id,
        'overall_score': scored.overall_score,
        'breakdown': scored.breakdown,
        'explanation': [
            f"Skill overlap contributes {scored.breakdown['skill_match']}%",
            f"Experience alignment contributes {scored.breakdown['experience_score']}%",
            f"Location compatibility contributes {scored.breakdown['location_score']}%",
            f"Salary alignment contributes {scored.breakdown['salary_score']}%",
        ],
        'recommendation': scored.recommendation,
    }
