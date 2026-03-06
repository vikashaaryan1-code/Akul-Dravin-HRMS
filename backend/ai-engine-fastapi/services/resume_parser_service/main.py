from __future__ import annotations

import re

from fastapi import FastAPI

from common.schemas import HealthResponse, ResumeParseRequest, ResumeParseResult
from common.text_utils import extract_email, extract_phone, sentence_count, tokenize

app = FastAPI(title='Resume Parsing Service', version='1.0.0')

SKILL_DICTIONARY = {
    'python', 'java', 'javascript', 'typescript', 'node.js', 'react', 'next.js', 'postgresql', 'mysql',
    'aws', 'docker', 'kubernetes', 'fastapi', 'nestjs', 'machine learning', 'data analysis',
    'communication', 'leadership', 'recruitment', 'payroll', 'hrms', 'elasticsearch', 'redis', 'rabbitmq'
}

EDUCATION_KEYWORDS = ['b.tech', 'm.tech', 'mba', 'bca', 'mca', 'b.sc', 'm.sc', 'phd', 'diploma']


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='resume_parser_service')


def parse_resume(payload: ResumeParseRequest) -> ResumeParseResult:
    text = payload.resume_text.strip()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    first_line = lines[0] if lines else None

    email = extract_email(text)
    phone = extract_phone(text)

    lowered_text = text.lower()
    tokens = set(tokenize(lowered_text))
    detected_skills = sorted({skill for skill in SKILL_DICTIONARY if skill in lowered_text or skill in tokens})

    experience_match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs|year)', lowered_text)
    experience_years = float(experience_match.group(1)) if experience_match else None

    education = [keyword.upper() for keyword in EDUCATION_KEYWORDS if keyword in lowered_text]

    sentence_parts = [part.strip() for part in re.split(r'[.!?]+', text) if part.strip()]
    summary = '. '.join(sentence_parts[:2]).strip()
    if summary:
        summary += '.'
    else:
        summary = text[:220]

    entities = {
        'line_count': len(lines),
        'sentence_count': sentence_count(text),
        'token_count': len(tokens),
    }

    return ResumeParseResult(
        candidate_id=payload.candidate_id,
        name=first_line,
        email=email,
        phone=phone,
        skills=detected_skills,
        total_experience_years=experience_years,
        education=education,
        summary=summary,
        entities=entities,
    )


@app.post('/v1/resume/parse', response_model=ResumeParseResult)
def parse_resume_endpoint(payload: ResumeParseRequest) -> ResumeParseResult:
    return parse_resume(payload)


@app.post('/v1/resume/parse/batch', response_model=list[ResumeParseResult])
def parse_resume_batch(payloads: list[ResumeParseRequest]) -> list[ResumeParseResult]:
    return [parse_resume(item) for item in payloads]
