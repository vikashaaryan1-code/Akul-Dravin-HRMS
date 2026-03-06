from __future__ import annotations

from ml_pipeline.train_attrition_model import train_attrition_model
from ml_pipeline.train_matching_model import train_matching_model


def train_all_models() -> dict:
    attrition_metrics = train_attrition_model()
    matching_metrics = train_matching_model()

    return {
        'attrition_model': attrition_metrics,
        'matching_model': matching_metrics,
    }


if __name__ == '__main__':
    summary = train_all_models()
    print(summary)
