from __future__ import annotations

from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from common.model_registry import ModelRegistry


TRAINING_FILE = Path('backend/ai-engine-fastapi/data/training/attrition_training.csv')
FEATURE_COLUMNS = [
    'tenure_months',
    'monthly_ctc',
    'overtime_hours',
    'leave_days_last_quarter',
    'performance_rating',
    'manager_change_count',
]
TARGET_COLUMN = 'attrition_label'
MODEL_NAME = 'attrition_prediction_model'


def train_attrition_model() -> dict:
    if not TRAINING_FILE.exists():
        raise FileNotFoundError(f'Training file not found: {TRAINING_FILE}')

    df = pd.read_csv(TRAINING_FILE)
    missing = [column for column in FEATURE_COLUMNS + [TARGET_COLUMN] if column not in df.columns]
    if missing:
        raise ValueError(f'Missing required columns: {missing}')

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preprocessor = ColumnTransformer(
        transformers=[('num', StandardScaler(), FEATURE_COLUMNS)],
        remainder='drop',
    )

    model = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('classifier', LogisticRegression(max_iter=500, class_weight='balanced')),
        ]
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        'accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
        'f1_score': round(float(f1_score(y_test, y_pred)), 4),
        'roc_auc': round(float(roc_auc_score(y_test, y_proba)), 4),
        'train_rows': int(len(X_train)),
        'test_rows': int(len(X_test)),
        'features': FEATURE_COLUMNS,
    }

    registry = ModelRegistry()
    registry.save_model(MODEL_NAME, model, version='latest')
    registry.save_metrics(MODEL_NAME, metrics, version='latest')

    return metrics


if __name__ == '__main__':
    trained = train_attrition_model()
    print(trained)
