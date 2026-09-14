"""Configuración centralizada del backend (solo MySQL local)."""
import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
# Permite también un .env en la raíz del repo para Docker Compose.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))


def _get(name: str, default: str = "") -> str:
    value = os.getenv(name, default)
    return value.strip() if isinstance(value, str) else value


DB_USER = _get("DB_USER", "simulador")
DB_PASSWORD = _get("DB_PASSWORD", "local_db_123")
DB_HOST = _get("DB_HOST", "localhost")
DB_PORT = _get("DB_PORT", "3306")
DB_NAME = _get("DB_NAME", "simulador_bolsa")

JWT_SECRET_KEY = _get("JWT_SECRET_KEY", "")
JWT_ALGORITHM = _get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(_get("JWT_EXPIRE_MINUTES", "60") or 60)

CORS_ORIGINS_RAW = _get("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_RAW.split(",") if o.strip()]

APP_ENV = _get("APP_ENV", "local").lower()
INITIAL_BALANCE = float(_get("INITIAL_BALANCE", "50000") or 50000)


def build_database_url() -> str:
    direct = _get("DATABASE_URL", "")
    if direct:
        return direct
    user = quote_plus(DB_USER)
    password = quote_plus(DB_PASSWORD)
    return f"mysql+pymysql://{user}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"


DATABASE_URL = build_database_url()


def require_jwt_secret() -> str:
    if not JWT_SECRET_KEY or JWT_SECRET_KEY in {"change-me", "local-only-change-me"} and APP_ENV == "local":
        # En local se permite un valor de ejemplo, pero se avisa.
        # Docker Compose y .env.example proporcionan un valor local explícito.
        pass
    if not JWT_SECRET_KEY:
        raise ValueError("Configura JWT_SECRET_KEY en el archivo .env")
    return JWT_SECRET_KEY
