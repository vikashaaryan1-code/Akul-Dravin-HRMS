from __future__ import annotations

from fastapi import FastAPI

from common.schemas import (
    HealthResponse,
    ProductivityAlertRequest,
    ProductivityAlertResponse,
    SkillGapRequest,
    SkillGapResponse,
    WorkforceForecastRequest,
    WorkforceForecastResponse,
)

app = FastAPI(title='Workforce Analytics Service', version='1.0.0')


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='workforce_analytics_service')


@app.post('/v1/workforce/forecast/hiring-demand', response_model=WorkforceForecastResponse)
def forecast_hiring_demand(payload: WorkforceForecastRequest) -> WorkforceForecastResponse:
    recent_headcount = payload.historical_headcount[-1]
    recent_attrition = payload.historical_attrition_rate[-1] if payload.historical_attrition_rate else 0.0

    projected_headcount: list[int] = []
    projected_hiring_demand: list[int] = []

    current = recent_headcount
    growth_factor = payload.growth_target_percent / 100.0

    for _ in range(payload.forecast_months):
        projected = int(current * (1 + growth_factor / 12.0))
        attrition_loss = int(projected * (recent_attrition / 100.0) / 12.0)
        hiring_needed = max(0, projected - current + attrition_loss)

        current = projected
        projected_headcount.append(projected)
        projected_hiring_demand.append(hiring_needed)

    return WorkforceForecastResponse(
        company_id=payload.company_id,
        projected_headcount=projected_headcount,
        projected_hiring_demand=projected_hiring_demand,
    )


@app.post('/v1/workforce/skill-gap', response_model=SkillGapResponse)
def skill_gap(payload: SkillGapRequest) -> SkillGapResponse:
    required = {skill.strip().lower() for skill in payload.required_skills if skill.strip()}
    available = {skill.strip().lower() for skill in payload.available_skills if skill.strip()}

    missing = sorted(required - available)
    coverage = 100.0 if not required else ((len(required & available) / len(required)) * 100.0)

    return SkillGapResponse(
        company_id=payload.company_id,
        missing_skills=missing,
        coverage_percent=round(coverage, 2),
    )


@app.post('/v1/workforce/productivity-alerts', response_model=ProductivityAlertResponse)
def productivity_alerts(payload: ProductivityAlertRequest) -> ProductivityAlertResponse:
    average_score = sum(payload.team_productivity_scores) / max(len(payload.team_productivity_scores), 1)

    if payload.baseline_score <= 0:
        deviation = 0.0
    else:
        deviation = ((payload.baseline_score - average_score) / payload.baseline_score) * 100.0

    alert = deviation >= 8.0
    recommendation = (
        'Investigate workload distribution, manager bandwidth, and engagement drivers.' if alert else 'No major action required.'
    )

    return ProductivityAlertResponse(
        company_id=payload.company_id,
        alert=alert,
        average_score=round(average_score, 2),
        deviation_percent=round(deviation, 2),
        recommendation=recommendation,
    )
