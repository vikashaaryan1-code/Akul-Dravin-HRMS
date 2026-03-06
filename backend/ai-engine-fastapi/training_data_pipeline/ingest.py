from __future__ import annotations

from pathlib import Path

import pandas as pd


RAW_DIR = Path('backend/ai-engine-fastapi/data/raw')
PROCESSED_DIR = Path('backend/ai-engine-fastapi/data/processed')


def ingest_csv_exports(pattern: str = '*.csv') -> pd.DataFrame:
    files = sorted(RAW_DIR.glob(pattern))
    if not files:
        raise FileNotFoundError(f'No raw data files found in {RAW_DIR}')

    frames = [pd.read_csv(file) for file in files]
    combined = pd.concat(frames, ignore_index=True)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / 'ingested.csv'
    combined.to_csv(output_path, index=False)

    return combined


if __name__ == '__main__':
    df = ingest_csv_exports()
    print(f'Ingested records: {len(df)}')
