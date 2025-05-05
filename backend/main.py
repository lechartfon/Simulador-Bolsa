from fastapi import FastAPI
from auth import router as auth_router
from database import engine
from models import Base

app = FastAPI()

# Crea las tablas si no existen
Base.metadata.create_all(bind=engine)

# Rutas de autenticación
app.include_router(auth_router)
