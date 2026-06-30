from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    LLM_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    COGNEE_API_KEY: str = ""
    COGNEE_SKIP_CONNECTION_TEST: str = "true"
    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5500"]

    class Config:
        env_file = ".env"
        extra = "ignore"   # 👈 this is the key line — ignores unknown env vars

settings = Settings()