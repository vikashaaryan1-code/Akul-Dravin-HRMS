from __future__ import annotations

from pathlib import Path

import pandas as pd


PROCESSED_DIR = Path('backend/ai-engine-fastapi/data/processed')


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()

    cleaned.columns = [column.strip().lower().replace(' ', '_') for column in cleaned.columns]
    cleaned = cleaned.drop_duplicates()

    for column in cleaned.select_dtypes(include=['object']).columns:
        cleaned[column] = cleaned[column].astype(str).str.strip()

    cleaned = cleaned.fillna({
        'skills': '',
        'location': '',
        'department': '',
        'designation': '',
    })

    return cleaned


def load_and_clean(input_file: str = 'ingested.csv') -> pd.DataFrame:
    source_path = PROCESSED_DIR / input_file
    if not source_path.exists():
        raise FileNotFoundError(f'Expected file not found: {source_path}')

    df = pd.read_csv(source_path)
    cleaned = clean_dataset(df)

    output_path = PROCESSED_DIR / 'cleaned.csv'
    cleaned.to_csv(output_path, index=False)

    return cleaned


if __name__ == '__main__':
    frame = load_and_clean()
    print(f'Cleaned records: {len(frame)}')
