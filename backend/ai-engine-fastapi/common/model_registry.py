from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from common.config import get_settings


class ModelRegistry:
    def __init__(self, base_dir: str | None = None) -> None:
        settings = get_settings()
        self.base_path = Path(base_dir or settings.model_registry_dir)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def model_path(self, model_name: str, version: str = 'latest') -> Path:
        return self.base_path / model_name / f'{version}.joblib'

    def metrics_path(self, model_name: str, version: str = 'latest') -> Path:
        return self.base_path / model_name / f'{version}.metrics.json'

    def save_model(self, model_name: str, model: Any, version: str = 'latest') -> str:
        path = self.model_path(model_name, version)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path)
        return str(path)

    def load_model(self, model_name: str, version: str = 'latest') -> Any:
        path = self.model_path(model_name, version)
        if not path.exists():
            return None
        return joblib.load(path)

    def save_metrics(self, model_name: str, metrics: dict[str, Any], version: str = 'latest') -> str:
        import json

        path = self.metrics_path(model_name, version)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(metrics, indent=2), encoding='utf-8')
        return str(path)

    def load_metrics(self, model_name: str, version: str = 'latest') -> dict[str, Any]:
        import json

        path = self.metrics_path(model_name, version)
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding='utf-8'))
