import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from auth import router as auth_router
from config import APP_ENV, CORS_ORIGINS
from database import SessionLocal
from routes.classroom import router as classroom_router
from routes.news import router as news_router
from routes.stocks import router as stocks_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simulador de Bolsa", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router, prefix="")
app.include_router(stocks_router, prefix="")
app.include_router(classroom_router, prefix="")
app.include_router(news_router, prefix="")


@app.get("/")
async def root():
    return {"message": "API del simulador de bolsa funcionando correctamente", "env": APP_ENV}


@app.get("/healthz")
async def healthz():
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
        return {"status": "ok"}
    except Exception as exc:  # noqa: BLE001 - healthcheck debe ser genérico
        logger.warning("Healthcheck con error: %s", type(exc).__name__)
        return {"status": "error"}
