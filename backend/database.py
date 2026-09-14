from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import APP_ENV, DATABASE_URL

# Solo MySQL local. Sin fallback a Supabase/Postgres.
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_local_env() -> bool:
    return APP_ENV == "local"
