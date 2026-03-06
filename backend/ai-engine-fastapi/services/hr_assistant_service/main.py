from __future__ import annotations

import re

from fastapi import FastAPI

from common.schemas import (
    HRChatRequest,
    HRChatResponse,
    HealthResponse,
    PolicySummaryRequest,
    PolicySummaryResponse,
)

app = FastAPI(title='AI HR Assistant Service', version='1.0.0')

POLICY_KB = {
    'leave': 'Employees can apply leave through ESS. Approval chain: Manager -> HR -> Department Head.',
    'payroll': 'Payroll is processed monthly after attendance and leave reconciliation. Payslips are digitally signed.',
    'attendance': 'Attendance supports GPS, biometric, and face recognition with geofencing policies.',
    'onboarding': 'Onboarding includes document verification, policy acknowledgement, and manager checklist.',
    'performance': 'Performance cycle includes quarterly goals, review calibration, and manager feedback.',
}

ACTION_HINTS = {
    'leave': ['Open leave balance panel', 'Submit leave request workflow'],
    'payroll': ['View payroll breakup', 'Download latest payslip'],
    'attendance': ['Check today check-in log', 'Raise attendance correction request'],
    'onboarding': ['Open onboarding checklist', 'Upload pending documents'],
    'performance': ['View OKR dashboard', 'Schedule 1:1 review'],
}


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='hr_assistant_service')


def pick_topic(question: str) -> str:
    lowered = question.lower()
    for topic in POLICY_KB:
        if topic in lowered:
            return topic
    return 'general'


@app.post('/v1/hr-assistant/query', response_model=HRChatResponse)
def hr_query(payload: HRChatRequest) -> HRChatResponse:
    topic = pick_topic(payload.question)

    if topic in POLICY_KB:
        answer = POLICY_KB[topic]
        confidence = 0.88
        actions = ACTION_HINTS.get(topic, [])
        citations = [f'policy::{topic}']
    else:
        answer = (
            'I can help with leave, payroll, attendance, onboarding, and performance policies. '
            'Please refine your question with one of these topics.'
        )
        confidence = 0.62
        actions = ['Ask about leave policy', 'Ask about payroll deductions']
        citations = ['policy::index']

    return HRChatResponse(answer=answer, confidence=confidence, suggested_actions=actions, citations=citations)


@app.post('/v1/hr-assistant/policy-summary', response_model=PolicySummaryResponse)
def summarize_policy(payload: PolicySummaryRequest) -> PolicySummaryResponse:
    clean_text = re.sub(r'\s+', ' ', payload.policy_text).strip()
    fragments = re.split(r'(?<=[.!?])\s+', clean_text)
    summary = ' '.join(fragments[:2]) if fragments else clean_text[:220]

    key_points = [fragment.strip() for fragment in fragments[:5] if fragment.strip()]
    if not key_points and clean_text:
        key_points = [clean_text]

    return PolicySummaryResponse(summary=summary, key_points=key_points)
