from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_env: str = 'dev'
    model_registry_dir: str = 'backend/ai-engine-fastapi/models/registry'
    default_top_k: int = 20
    orchestrator_base_url: str = 'http://localhost:9000'
    resume_parser_url: str = 'http://localhost:8001'
    matching_url: str = 'http://localhost:8002'
    interview_url: str = 'http://localhost:8003'
    workforce_url: str = 'http://localhost:8004'
    attrition_url: str = 'http://localhost:8005'
    hr_assistant_url: str = 'http://localhost:8006'

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')


@lru_cache
def get_settings() -> Settings:
    return Settings()
