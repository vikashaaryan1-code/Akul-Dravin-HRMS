from __future__ import annotations

from pathlib import Path

import pandas as pd


PROCESSED_DIR = Path('backend/ai-engine-fastapi/data/processed')
TRAINING_DIR = Path('backend/ai-engine-fastapi/data/training')


ATTRITION_COLUMNS = [
    'tenure_months',
    'monthly_ctc',
    'overtime_hours',
    'leave_days_last_quarter',
    'performance_rating',
    'manager_change_count',
    'attrition_label',
]

MATCHING_COLUMNS = [
    'skill_overlap',
    'experience_gap',
    'location_match',
    'salary_gap_ratio',
    'match_score_label',
]


def _coerce_numeric(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    for column in columns:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors='coerce').fillna(0)
    return df


def create_training_views(input_file: str = 'cleaned.csv') -> tuple[pd.DataFrame, pd.DataFrame]:
    source_path = PROCESSED_DIR / input_file
    if not source_path.exists():
        raise FileNotFoundError(f'Expected file not found: {source_path}')

    df = pd.read_csv(source_path)

    attrition_ready = _coerce_numeric(df.copy(), ATTRITION_COLUMNS)
    missing_attrition = [column for column in ATTRITION_COLUMNS if column not in attrition_ready.columns]
    if missing_attrition:
        for column in missing_attrition:
            attrition_ready[column] = 0

    matching_ready = _coerce_numeric(df.copy(), MATCHING_COLUMNS)
    missing_matching = [column for column in MATCHING_COLUMNS if column not in matching_ready.columns]
    if missing_matching:
        for column in missing_matching:
            matching_ready[column] = 0

    TRAINING_DIR.mkdir(parents=True, exist_ok=True)

    attrition_frame = attrition_ready[ATTRITION_COLUMNS]
    matching_frame = matching_ready[MATCHING_COLUMNS]

    attrition_frame.to_csv(TRAINING_DIR / 'attrition_training.csv', index=False)
    matching_frame.to_csv(TRAINING_DIR / 'matching_training.csv', index=False)

    return attrition_frame, matching_frame


if __name__ == '__main__':
    attrition_df, matching_df = create_training_views()
    print(f'Attrition rows: {len(attrition_df)} | Matching rows: {len(matching_df)}')
