from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "JAM Stack Base Application"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HTTP_PORT: int = 3000

    # Database
    DB_HOST: str = "base-app-db"
    DB_PORT: int = 5432
    DB_NAME: str = "base_app"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3010",
        "http://localhost:80",
    ]

    # JWT
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
