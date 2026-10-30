from typing import List, Union
import json

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEV_JWT_SECRET = "super-secret-jwt-key-minimum-32-chars-for-dev"
DEV_SUPABASE_URL = "https://localhost.supabase.co"
DEV_SUPABASE_KEY = "dummy-anon-key"
DEV_SERVICE_ROLE_KEY = "dummy-service-role-key"


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KindredBridge API"

    # Local development placeholders only. Production validation below rejects them.
    SUPABASE_URL: str = DEV_SUPABASE_URL
    SUPABASE_KEY: str = DEV_SUPABASE_KEY
    SUPABASE_SERVICE_ROLE_KEY: str = DEV_SERVICE_ROLE_KEY
    SUPABASE_JWT_SECRET: str = DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:54322/postgres"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str) and not value.startswith("["):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, str) and value.startswith("["):
            return json.loads(value)
        return value

    @model_validator(mode="after")
    def validate_production_configuration(self):
        if self.ENVIRONMENT.strip().lower() != "production":
            return self

        problems = []
        if not self.SUPABASE_URL.startswith("https://") or self.SUPABASE_URL == DEV_SUPABASE_URL:
            problems.append("SUPABASE_URL must be the real HTTPS Supabase project URL")
        if not self.SUPABASE_KEY or self.SUPABASE_KEY == DEV_SUPABASE_KEY:
            problems.append("SUPABASE_KEY must be configured")
        if not self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_SERVICE_ROLE_KEY == DEV_SERVICE_ROLE_KEY:
            problems.append("SUPABASE_SERVICE_ROLE_KEY must be configured")
        if not self.SUPABASE_JWT_SECRET or self.SUPABASE_JWT_SECRET == DEV_JWT_SECRET:
            problems.append(
                "SUPABASE_JWT_SECRET must not use the development placeholder because HS256 token verification is enabled"
            )
        if not self.CORS_ORIGINS:
            problems.append("CORS_ORIGINS must contain the deployed frontend origin")
        if any(origin.strip() == "*" for origin in self.CORS_ORIGINS):
            problems.append("CORS_ORIGINS cannot contain '*' when credentials are enabled")
        if any(not origin.startswith("https://") for origin in self.CORS_ORIGINS):
            problems.append("Production CORS origins must use HTTPS")
        if problems:
            raise ValueError("Invalid production configuration: " + "; ".join(problems))
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
