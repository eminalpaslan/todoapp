from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "To-Do API"
    environment: str = "development"
    allowed_origins: str = "http://localhost:8081,http://localhost:19006"
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def cors_origins(self) -> list[str]:
        # Virgulle ayrilmis string'i CORS middleware'in bekledigi listeye cevirir
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
