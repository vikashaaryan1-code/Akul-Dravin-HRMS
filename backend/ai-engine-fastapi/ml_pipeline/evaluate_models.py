from __future__ import annotations

from common.model_registry import ModelRegistry


def evaluate_registry_models() -> dict:
    registry = ModelRegistry()

    return {
        'attrition': {
            'model_loaded': registry.load_model('attrition_prediction_model') is not None,
            'metrics': registry.load_metrics('attrition_prediction_model'),
        },
        'matching': {
            'model_loaded': registry.load_model('candidate_matching_model') is not None,
            'metrics': registry.load_metrics('candidate_matching_model'),
        },
    }


if __name__ == '__main__':
    print(evaluate_registry_models())
