from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'nexo_leads.db'}"
    USER_AGENT: str = "NexoLeads/1.0 (Local Client Discovery; contact: contacto@nexoweb.pe)"
    OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    OVERPASS_FALLBACK_URLS: list[str] = [
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
    ]
    OVERPASS_TIMEOUT_SECONDS: int = 40
    REQUEST_DELAY_SECONDS: float = 1.5
    HTTP_VERIFY_TIMEOUT_SECONDS: float = 6.0
    DATA_DIR: Path = BASE_DIR / "data"

    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()
