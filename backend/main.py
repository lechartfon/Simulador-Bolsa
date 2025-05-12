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
from backend.routes.news import router as news_router
from backend.models import Base, Company, StockPrice, News, User
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
app.include_router(news_router, prefix="")

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

def initialize_default_news():
    db = SessionLocal()
    
    try:
        existing_news_count = db.query(News).count()
        if existing_news_count > 0:
            logging.info(f"Ya existen {existing_news_count} noticias en la base de datos.")
            return
        
        admin_user = db.query(User).filter(User.email == "admin@admin").first()
        if not admin_user:
            logging.warning("No se encontró el usuario admin@admin para crear noticias predeterminadas.")

            from passlib.hash import bcrypt
            hashed_pw = bcrypt.hash("admin")
            admin_user = User(email="admin@admin", hashed_password=hashed_pw)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logging.info("Usuario admin@admin creado automáticamente.")
        
        base_dates = [
            datetime.utcnow() - timedelta(days=2),
            datetime.utcnow() - timedelta(days=5),
            datetime.utcnow() - timedelta(days=8),
            datetime.utcnow() - timedelta(days=15),
            datetime.utcnow() - timedelta(days=21),
            datetime.utcnow() - timedelta(days=30)
        ]
        
        default_news = [
            {
                "title": "El IBEX 35 alcanza máximos anuales impulsado por el sector bancario",
                "content": "El principal indicador de la bolsa española ha superado los 11.000 puntos por primera vez en este año, con el sector bancario liderando las ganancias gracias a las expectativas de recortes de tipos de interés por parte del BCE.",
                "url": "https://elpais.com/economia/2023/bolsa-mercados/ibex-35-maximo-anual.html",
                "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[0],
                "updated_at": base_dates[0]
            },
            {
                "title": "La Unión Europea aprueba nuevas regulaciones para criptomonedas",
                "content": "El Parlamento Europeo ha aprobado el reglamento MiCA (Markets in Crypto-Assets), que establecerá un marco regulatorio completo para los activos digitales en toda la UE, con el objetivo de proteger a los inversores y garantizar la estabilidad financiera.",
                "url": "https://ec.europa.eu/commission/presscorner/detail/es/ip_23_1111",
                "image_url": "https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1469&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[1],
                "updated_at": base_dates[1]
            },
            {
                "title": "Telefónica anuncia un plan de inversión de 5.000 millones para infraestructura 5G",
                "content": "La operadora española ha presentado su estrategia para los próximos cinco años, que incluye una importante inversión en infraestructura 5G y fibra óptica en España y Latinoamérica, con el objetivo de liderar la transformación digital en estos mercados.",
                "url": "https://www.telefonica.com/es/sala-comunicacion/telefonica-plan-inversion-5g/",
                "image_url": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1470&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[2],
                "updated_at": base_dates[2]
            },
            {
                "title": "El Bitcoin supera los 50.000 dólares tras la aprobación de ETFs",
                "content": "La principal criptomoneda ha vuelto a superar la barrera psicológica de los 50.000 dólares después de que la SEC de Estados Unidos aprobara varios ETFs de Bitcoin al contado, lo que ha aumentado el interés institucional en el activo digital.",
                "url": "https://www.coindesk.com/markets/2023/bitcoin-price-etf-approval/",
                "image_url": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1469&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[3],
                "updated_at": base_dates[3]
            },
            {
                "title": "La FED mantiene tipos de interés pero señala posibles recortes para el segundo semestre",
                "content": "La Reserva Federal de Estados Unidos ha decidido mantener los tipos de interés en su última reunión, pero ha indicado que podría comenzar a recortarlos en la segunda mitad del año si la inflación continúa moderándose, lo que ha sido bien recibido por los mercados.",
                "url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230614a.htm",
                "image_url": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[4],
                "updated_at": base_dates[4]
            },
            {
                "title": "Iberdrola invertirá 47.000 millones en energías renovables hasta 2030",
                "content": "La compañía energética española ha anunciado un ambicioso plan de inversión en energías renovables para la próxima década, con el objetivo de triplicar su capacidad instalada y liderar la transición energética en Europa y América del Norte.",
                "url": "https://www.iberdrola.com/sala-comunicacion/noticias/plan-estrategico-2030",
                "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1470&auto=format&fit=crop",
                "created_by": admin_user.id,
                "created_at": base_dates[5],
                "updated_at": base_dates[5]
            }
        ]
        
        for news_data in default_news:
            news = News(**news_data)
            db.add(news)
        
        db.commit()
        logging.info(f"Se han creado {len(default_news)} noticias predeterminadas.")
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear noticias predeterminadas: {str(e)}")
    finally:
        db.close()

initialize_default_news()

# Rutas base
@app.get("/")
async def root():
    return {"message": "API del simulador de bolsa funcionando correctamente"}

@app.get("/transacciones/comprar/test")
async def test_comprar():
    return {"message": "Endpoint de compra accesible"}