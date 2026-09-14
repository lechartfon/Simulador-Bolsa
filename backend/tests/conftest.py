import os
import sys

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-min-32-chars-1234567890")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_api.db")
os.environ.setdefault("APP_ENV", "test")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db


@pytest.fixture()
def sqlite_engine(tmp_path):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(sqlite_engine):
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    from main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
