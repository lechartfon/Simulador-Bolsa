from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.auth import router as auth_router  
from backend.routes.stocks import router as stocks_router
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from .models import Base, StockPrice
from .database import engine
from backend.database import SessionLocal
from backend.models import Company, StockPrice
from datetime import datetime, timedelta
import random

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# Incluir el router de stocks
app.include_router(stocks_router)

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

            # Simulamos datos históricos para la gráfica
            for i in range(30):  # 30 días atrás
                price = StockPrice(
                    company_id=company.id,
                    timestamp=datetime.utcnow() - timedelta(days=30 - i),
                    price=round(random.uniform(100, 500), 2)
                )
                db.add(price)

            db.commit()
    db.close()

# Llamamos la función cuando se arranca la app
initialize_default_companies()