from __future__ import annotations

from typing import Any

import numpy as np

from common.text_utils import normalize_skill_set


def jaccard_similarity(a: list[str], b: list[str]) -> float:
    set_a = set(normalize_skill_set(a))
    set_b = set(normalize_skill_set(b))
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def numeric_score(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    clipped = min(max(value, low), high)
    return (clipped - low) / (high - low)


def weighted_score(parts: dict[str, tuple[float, float]]) -> float:
    weights = np.array([max(weight, 0.0) for _, weight in parts.values()], dtype=float)
    scores = np.array([score for score, _ in parts.values()], dtype=float)
    if weights.sum() == 0:
        return float(scores.mean()) if len(scores) else 0.0
    return float(np.dot(scores, weights) / weights.sum())


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
