import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

db_url = os.getenv("DATABASE_URL")
print("DATABASE_URL:", db_url)

from sqlalchemy import create_engine, text

engine = create_engine(db_url)
with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("DB connection OK:", result.scalar())
