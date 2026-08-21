from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "SignTranslate-AI Backend"
    host: str = "127.0.0.1"
    port: int = 8000
    camera_index: int = 0
    frame_width: int = 1280
    frame_height: int = 720
    fps_target: int = 30
    confidence_threshold: float = 0.8
    num_landmarks: int = 21
    num_coords: int = 3
    num_hands: int = 2
    sequence_length: int = 30
    data_dir: str = "data"
    models_dir: str = "models_store"
    tts_engine: str = "pyttsx3"

    database_url: str = (
        "postgresql+psycopg2://feon_user:feon_secret@127.0.0.1:5432/feon_tanana"
    )
    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24


settings = Settings()