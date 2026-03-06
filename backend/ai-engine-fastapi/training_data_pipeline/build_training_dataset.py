from __future__ import annotations

from training_data_pipeline.clean import load_and_clean
from training_data_pipeline.feature_engineering import create_training_views
from training_data_pipeline.ingest import ingest_csv_exports


def run_training_data_pipeline() -> None:
    ingest_csv_exports()
    load_and_clean()
    create_training_views()


if __name__ == '__main__':
    run_training_data_pipeline()
    print('Training data pipeline completed successfully.')
