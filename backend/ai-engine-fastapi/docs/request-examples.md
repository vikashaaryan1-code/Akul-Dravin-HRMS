# AI Service Request Examples

## Resume Parsing
`POST /v1/resume/parse`
```json
{
  "candidate_id": "cand-1001",
  "file_name": "priya_nair_resume.pdf",
  "resume_text": "Priya Nair\nSenior Software Engineer\nEmail: priya@example.com\nSkills: Node.js, PostgreSQL, AWS, Docker\n7 years experience..."
}
```

## Candidate Matching
`POST /v1/matching/score`
```json
{
  "candidate": {
    "candidate_id": "cand-1001",
    "skills": ["node.js", "postgresql", "aws"],
    "total_experience_years": 7,
    "preferred_locations": ["bengaluru", "remote"],
    "expected_ctc": 2200000
  },
  "job": {
    "job_id": "job-2201",
    "required_skills": ["node.js", "postgresql", "redis"],
    "min_experience_years": 5,
    "location": "bengaluru",
    "offered_ctc": 2400000
  }
}
```

## Interview Analysis
`POST /v1/interview/analyze`
```json
{
  "interview_id": "int-4401",
  "transcript": "I led platform migration, improved reliability, and collaborated with product teams...",
  "duration_minutes": 42,
  "language": "en"
}
```

## Workforce Forecast
`POST /v1/workforce/forecast/hiring-demand`
```json
{
  "company_id": "comp-1",
  "historical_headcount": [500, 520, 540, 560],
  "historical_attrition_rate": [12.0, 11.5, 11.8, 12.2],
  "growth_target_percent": 18,
  "forecast_months": 6
}
```

## Attrition Prediction
`POST /v1/attrition/predict`
```json
{
  "employee_id": "emp-321",
  "tenure_months": 18,
  "monthly_ctc": 125000,
  "overtime_hours": 32,
  "leave_days_last_quarter": 6,
  "performance_rating": 3.2,
  "manager_change_count": 2
}
```

## HR Assistant
`POST /v1/hr-assistant/query`
```json
{
  "user_id": "emp-321",
  "role": "employee",
  "question": "How is earned leave carry forward calculated?",
  "context": {
    "tenant_id": "tenant-akul",
    "language": "en"
  }
}
```

## Orchestrator Hiring Intelligence
`POST /v1/ai/hiring-intelligence`
```json
{
  "resume": {
    "candidate_id": "cand-1001",
    "resume_text": "..."
  },
  "job": {
    "job_id": "job-2201",
    "required_skills": ["node.js", "postgresql"],
    "min_experience_years": 5,
    "location": "bengaluru",
    "offered_ctc": 2400000
  },
  "transcript": "Candidate discussion transcript..."
}
```
