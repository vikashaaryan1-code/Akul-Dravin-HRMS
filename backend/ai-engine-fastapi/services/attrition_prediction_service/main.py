from __future__ import annotations

from typing import Any

import numpy as np
from fastapi import FastAPI

from common.model_registry import ModelRegistry
from common.schemas import (
    AttritionBatchRequest,
    AttritionPredictionRequest,
    AttritionPredictionResponse,
    HealthResponse,
)

app = FastAPI(title='Attrition Prediction Service', version='1.0.0')
registry = ModelRegistry()
ATTRITION_MODEL_NAME = 'attrition_prediction_model'


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service='attrition_prediction_service')


def to_feature_vector(payload: AttritionPredictionRequest) -> list[float]:
    return [
        payload.tenure_months,
        payload.monthly_ctc,
        payload.overtime_hours,
        payload.leave_days_last_quarter,
        payload.performance_rating,
        float(payload.manager_change_count),
    ]


def fallback_probability(payload: AttritionPredictionRequest) -> float:
    score = (
        0.015 * payload.overtime_hours
        + 0.02 * payload.leave_days_last_quarter
        + 0.008 * payload.manager_change_count
        - 0.04 * payload.performance_rating
        - 0.001 * (payload.tenure_months / 12.0)
    )
    probability = 1 / (1 + np.exp(-(score - 0.2)))
    return float(np.clip(probability, 0.01, 0.99))


def predict_probability(payload: AttritionPredictionRequest) -> float:
    model: Any = registry.load_model(ATTRITION_MODEL_NAME)
    if model is None:
        return fallback_probability(payload)

    features = np.array([to_feature_vector(payload)])

    if hasattr(model, 'predict_proba'):
        return float(model.predict_proba(features)[0][1])

    prediction = model.predict(features)[0]
    return float(np.clip(prediction, 0.01, 0.99))


def explain(payload: AttritionPredictionRequest) -> dict[str, float]:
    factors = {
        'overtime_pressure': round(min(payload.overtime_hours / 60.0, 1.0), 3),
        'leave_stress': round(min(payload.leave_days_last_quarter / 25.0, 1.0), 3),
        'manager_volatility': round(min(payload.manager_change_count / 4.0, 1.0), 3),
        'performance_protection': round(max(0.0, min(payload.performance_rating / 5.0, 1.0)), 3),
    }
    return factors


def to_response(payload: AttritionPredictionRequest) -> AttritionPredictionResponse:
    probability = predict_probability(payload)

    if probability >= 0.7:
        band = 'high'
        recommendation = 'Launch retention intervention, manager check-in, and compensation benchmarking.'
    elif probability >= 0.4:
        band = 'medium'
        recommendation = 'Start engagement plan and monitor trend for next 60 days.'
    else:
        band = 'low'
        recommendation = 'Continue regular engagement cadence.'

    return AttritionPredictionResponse(
        employee_id=payload.employee_id,
        attrition_probability=round(probability, 4),
        risk_band=band,
        contributing_factors=explain(payload),
        recommendation=recommendation,
    )


@app.post('/v1/attrition/predict', response_model=AttritionPredictionResponse)
def predict(payload: AttritionPredictionRequest) -> AttritionPredictionResponse:
    return to_response(payload)


@app.post('/v1/attrition/predict/batch', response_model=list[AttritionPredictionResponse])
def predict_batch(payload: AttritionBatchRequest) -> list[AttritionPredictionResponse]:
    return [to_response(item) for item in payload.employees]


@app.get('/v1/attrition/model/metrics', response_model=dict)
def model_metrics() -> dict:
    metrics = registry.load_metrics(ATTRITION_MODEL_NAME)
    return {
        'model_name': ATTRITION_MODEL_NAME,
        'metrics': metrics,
        'model_loaded': registry.load_model(ATTRITION_MODEL_NAME) is not None,
    }
