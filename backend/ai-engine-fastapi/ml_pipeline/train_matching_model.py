from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from common.model_registry import ModelRegistry


TRAINING_FILE = Path('backend/ai-engine-fastapi/data/training/matching_training.csv')
FEATURE_COLUMNS = ['skill_overlap', 'experience_gap', 'location_match', 'salary_gap_ratio']
TARGET_COLUMN = 'match_score_label'
MODEL_NAME = 'candidate_matching_model'


def train_matching_model() -> dict:
    if not TRAINING_FILE.exists():
        raise FileNotFoundError(f'Training file not found: {TRAINING_FILE}')

    df = pd.read_csv(TRAINING_FILE)
    missing = [column for column in FEATURE_COLUMNS + [TARGET_COLUMN] if column not in df.columns]
    if missing:
        raise ValueError(f'Missing required columns: {missing}')

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=180,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    metrics = {
        'mae': round(float(mean_absolute_error(y_test, predictions)), 4),
        'rmse': round(float(rmse), 4),
        'r2': round(float(r2_score(y_test, predictions)), 4),
        'train_rows': int(len(X_train)),
        'test_rows': int(len(X_test)),
        'features': FEATURE_COLUMNS,
    }

    registry = ModelRegistry()
    registry.save_model(MODEL_NAME, model, version='latest')
    registry.save_metrics(MODEL_NAME, metrics, version='latest')

    return metrics


if __name__ == '__main__':
    trained = train_matching_model()
    print(trained)
