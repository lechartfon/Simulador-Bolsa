from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

# Importaciones internas
from backend.auth import router as auth_router
from backend.routes.stocks import router as stocks_router
from backend.routes.classroom import router as classroom_router  
from backend.models import Base, Company, StockPrice
from backend.database import engine, SessionLocal, get_db
from backend.auth import get_current_user

# Configurar el registro de errores
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Configurar CORS para permitir solicitudes desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL del frontend
    allow_credentials=True,  # Permite enviar cookies y cabeceras de autorización
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todas las cabeceras HTTP
    expose_headers=["*"],  # Exponer todas las cabeceras de respuesta
)

# Incluir los routers con prefijos explícitos
app.include_router(auth_router, prefix="")
app.include_router(stocks_router, prefix="")
app.include_router(classroom_router, prefix="")

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

def initialize_default_companies():
    db = SessionLocal()
    default_companies = [
        {"symbol": "ANA", "name": "Acciona"},
        {"symbol": "ANE", "name": "Acciona Energía"},
        {"symbol": "ACX", "name": "Acerinox"},
        {"symbol": "ACS", "name": "ACS"},
        {"symbol": "AENA", "name": "Aena"},
        {"symbol": "AMS", "name": "Amadeus"},
        {"symbol": "MTS", "name": "ArcelorMittal"},
        {"symbol": "SAB", "name": "Banco Sabadell"},
        {"symbol": "SAN", "name": "Banco Santander"},
        {"symbol": "BKT", "name": "Bankinter"},
        {"symbol": "BBVA", "name": "BBVA"},
        {"symbol": "CABK", "name": "CaixaBank"},
        {"symbol": "CLNX", "name": "Cellnex"},
        {"symbol": "COL", "name": "Colonial"},
        {"symbol": "ENG", "name": "Enagás"},
        {"symbol": "ELE", "name": "Endesa"},
        {"symbol": "FER", "name": "Ferrovial"},
        {"symbol": "FDR", "name": "Fluidra"},
        {"symbol": "GRF", "name": "Grifols"},
        {"symbol": "IAG", "name": "IAG"},
        {"symbol": "IBE", "name": "Iberdrola"},
        {"symbol": "IDR", "name": "Indra"},
        {"symbol": "ITX", "name": "Inditex"},
        {"symbol": "LOG", "name": "Logista"},
        {"symbol": "MAP", "name": "Mapfre"},
        {"symbol": "MEL", "name": "Meliá Hotels"},
        {"symbol": "MRL", "name": "Merlin Properties"},
        {"symbol": "NTGY", "name": "Naturgy"},
        {"symbol": "REDE", "name": "Redeia"},
        {"symbol": "REP", "name": "Repsol"},
        {"symbol": "ROVI", "name": "Rovi"},
        {"symbol": "SAC", "name": "Sacyr"},
        {"symbol": "SLR", "name": "Solaria"},
        {"symbol": "TEL", "name": "Telefónica"},
        {"symbol": "UNI", "name": "Unicaja Banco"}
    ]
    
    for company_data in default_companies:
        existing = db.query(Company).filter(Company.name == company_data["name"]).first()
        if not existing:
            company = Company(**company_data)
            db.add(company)
            db.commit()
            db.refresh(company)
        else:
            company = existing
            
            existing_prices = db.query(StockPrice).filter(StockPrice.company_id == company.id).first()
            
            if existing_prices:
                logging.info(f"Deleting existing price data for {company.name}")
                db.query(StockPrice).filter(StockPrice.company_id == company.id).delete()
                db.commit()

        random.seed(company.id * 1000)

        base_price = random.uniform(100, 500)
        num_days = 365  
        
        for i in range(num_days):  
            day_variation = (random.random() - 0.5) * 0.05 
            current_price = base_price * (1 + day_variation)
            
            if i % 30 == 0 and i > 0:
                event_variation = (random.random() - 0.5) * 0.15  
                current_price = current_price * (1 + event_variation)
            
            trend_factor = (company.id % 5 - 2) * 0.0001  
            current_price = current_price * (1 + trend_factor)
            
            current_price = max(current_price, 20)
            
            price = StockPrice(
                company_id=company.id,
                timestamp=datetime.utcnow() - timedelta(days=num_days - i),
                price=round(current_price, 2)
            )
            db.add(price)
            
            base_price = current_price

        random.seed()
        
        db.commit()
    db.close()

initialize_default_companies()

# Rutas base
@app.get("/")
async def root():
    return {"message": "API del simulador de bolsa funcionando correctamente"}

@app.get("/transacciones/comprar/test")
async def test_comprar():
    return {"message": "Endpoint de compra accesible"}