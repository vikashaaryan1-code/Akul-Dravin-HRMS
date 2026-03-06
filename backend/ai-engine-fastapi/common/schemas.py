from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = 'ok'
    service: str
    version: str = '1.0.0'


class ResumeParseRequest(BaseModel):
    candidate_id: str | None = None
    file_name: str | None = None
    resume_text: str = Field(min_length=20)


class ResumeParseResult(BaseModel):
    candidate_id: str | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = Field(default_factory=list)
    total_experience_years: float | None = None
    education: list[str] = Field(default_factory=list)
    summary: str
    entities: dict[str, Any] = Field(default_factory=dict)


class CandidateProfile(BaseModel):
    candidate_id: str
    skills: list[str] = Field(default_factory=list)
    total_experience_years: float = 0
    preferred_locations: list[str] = Field(default_factory=list)
    expected_ctc: float | None = None


class JobProfile(BaseModel):
    job_id: str
    required_skills: list[str] = Field(default_factory=list)
    min_experience_years: float = 0
    location: str | None = None
    offered_ctc: float | None = None


class MatchingRequest(BaseModel):
    candidate: CandidateProfile
    job: JobProfile


class MatchScoreResponse(BaseModel):
    candidate_id: str
    job_id: str
    overall_score: float
    breakdown: dict[str, float]
    recommendation: str


class RankCandidatesRequest(BaseModel):
    job: JobProfile
    candidates: list[CandidateProfile]
    top_k: int = 20


class RankCandidatesResponse(BaseModel):
    job_id: str
    ranked_candidates: list[MatchScoreResponse]


class InterviewAnalysisRequest(BaseModel):
    interview_id: str
    transcript: str = Field(min_length=30)
    duration_minutes: float | None = None
    language: str = 'en'


class InterviewAnalysisResponse(BaseModel):
    interview_id: str
    communication_score: float
    confidence_score: float
    sentiment_score: float
    culture_fit_score: float
    recommendation: str
    summary: str
    bias_flags: list[str] = Field(default_factory=list)


class WorkforceForecastRequest(BaseModel):
    company_id: str
    historical_headcount: list[int] = Field(min_length=3)
    historical_attrition_rate: list[float] = Field(min_length=3)
    growth_target_percent: float = 0
    forecast_months: int = 6


class WorkforceForecastResponse(BaseModel):
    company_id: str
    projected_headcount: list[int]
    projected_hiring_demand: list[int]


class SkillGapRequest(BaseModel):
    company_id: str
    required_skills: list[str]
    available_skills: list[str]


class SkillGapResponse(BaseModel):
    company_id: str
    missing_skills: list[str]
    coverage_percent: float


class ProductivityAlertRequest(BaseModel):
    company_id: str
    team_productivity_scores: list[float]
    baseline_score: float


class ProductivityAlertResponse(BaseModel):
    company_id: str
    alert: bool
    average_score: float
    deviation_percent: float
    recommendation: str


class AttritionPredictionRequest(BaseModel):
    employee_id: str
    tenure_months: float
    monthly_ctc: float
    overtime_hours: float
    leave_days_last_quarter: float
    performance_rating: float
    manager_change_count: int = 0


class AttritionPredictionResponse(BaseModel):
    employee_id: str
    attrition_probability: float
    risk_band: str
    contributing_factors: dict[str, float]
    recommendation: str


class AttritionBatchRequest(BaseModel):
    employees: list[AttritionPredictionRequest]


class HRChatRequest(BaseModel):
    user_id: str
    role: str
    question: str = Field(min_length=3)
    context: dict[str, Any] = Field(default_factory=dict)


class HRChatResponse(BaseModel):
    answer: str
    confidence: float
    suggested_actions: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)


class PolicySummaryRequest(BaseModel):
    policy_text: str = Field(min_length=30)


class PolicySummaryResponse(BaseModel):
    summary: str
    key_points: list[str]


class HiringIntelligenceRequest(BaseModel):
    resume: ResumeParseRequest
    job: JobProfile
    transcript: str | None = None


class HiringIntelligenceResponse(BaseModel):
    resume: ResumeParseResult
    match: MatchScoreResponse
    interview: InterviewAnalysisResponse | None = None
    final_recommendation: str


class WorkforceIntelligenceRequest(BaseModel):
    forecast: WorkforceForecastRequest
    attrition_candidates: list[AttritionPredictionRequest]


class WorkforceIntelligenceResponse(BaseModel):
    forecast: WorkforceForecastResponse
    attrition_risks: list[AttritionPredictionResponse]
    strategic_recommendations: list[str]
