from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Opción 1: URL completa de conexión (recomendado)
DATABASE_URL = os.getenv("DATABASE_URL")

# Opción 2: Construir URL desde componentes (fallback)
if not DATABASE_URL:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    if SUPABASE_URL and SUPABASE_DB_PASSWORD:
        host = f"db.{SUPABASE_URL.replace('https://', '')}"
        DATABASE_URL = f"postgresql+psycopg2://postgres:{SUPABASE_DB_PASSWORD}@{host}:5432/postgres"

if not DATABASE_URL:
    raise ValueError("Configura DATABASE_URL o SUPABASE_URL + SUPABASE_DB_PASSWORD en .env")

print("DATABASE_URL:", DATABASE_URL[:30] + "..." + DATABASE_URL[-20:])

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
