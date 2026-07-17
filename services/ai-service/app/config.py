from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    EXAM_SERVICE_URL: str = "http://localhost:4002"
    STREAMING_SERVICE_URL: str = "http://localhost:4003"
    INTERNAL_API_KEY: str = "dev-internal-key"
    FRAME_SAMPLE_INTERVAL: int = 2
    AUDIO_WINDOW_SECONDS: int = 10
    OCR_INTERVAL: int = 5
    MIN_CONFIDENCE: float = 0.5
    USE_GPU: bool = False
    MODEL_DIR: str = "./models"
    REDIS_URL: str = "redis://localhost:6379"
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
