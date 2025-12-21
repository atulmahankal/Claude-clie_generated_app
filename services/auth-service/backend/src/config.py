from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Authentication service settings"""

    # Application
    APP_NAME: str = "Auth Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SERVICE_VERSION: str = "1.0.0"

    # Server ports
    HTTP_PORT: int = 3001
    GRPC_PORT: int = 50051

    # Database
    DB_HOST: str = "auth-db"
    DB_PORT: int = 5432
    DB_NAME: str = "auth"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    # JWT Configuration
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_REFRESH_SECRET: str = "your-refresh-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SMTP Configuration
    SMTP_HOST: str = "mailpit"
    SMTP_PORT: int = 1025
    SMTP_FROM_EMAIL: str = "noreply@jamstack.local"
    SMTP_FROM_NAME: str = "JAM Stack Auth"
    SMTP_USE_TLS: bool = False

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3010",
        "http://localhost:80",
    ]

    # Rate Limiting
    PASSWORD_RESET_MAX_ATTEMPTS: int = 3
    PASSWORD_RESET_WINDOW_MINUTES: int = 15
    EMAIL_VERIFY_MAX_ATTEMPTS: int = 5
    EMAIL_VERIFY_WINDOW_MINUTES: int = 15

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
