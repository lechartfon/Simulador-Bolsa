from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

# Importaciones internas
from auth import router as auth_router
from routes.stocks import router as stocks_router
from routes.classroom import router as classroom_router  
from routes.news import router as news_router
from models import Base, Company, StockPrice, News, User
from database import engine, SessionLocal, get_db
from auth import get_current_user

# Configuración básica para mostrar mensajes
print("Iniciando aplicación del simulador de bolsa...")

app = FastAPI()

# Configurar CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Incluir los routers con prefijos explícitos
app.include_router(auth_router, prefix="")
app.include_router(stocks_router, prefix="")
app.include_router(classroom_router, prefix="")
app.include_router(news_router, prefix="")

# Las tablas se gestionan mediante migraciones de Supabase
# Base.metadata.create_all(bind=engine)

def initialize_default_companies():
    # Conectar a la base de datos
    db = SessionLocal()
    
    # Lista de empresas del IBEX 35
    lista_empresas = [
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
    
    # Agregar cada empresa a la base de datos
    for datos in lista_empresas:
        # Ver si ya existe
        empresa = db.query(Company).filter(Company.name == datos["name"]).first()
        
        # Si no existe, crearla
        if not empresa:
            nueva_empresa = Company(**datos)
            db.add(nueva_empresa)
            db.commit()
            db.refresh(nueva_empresa)
            empresa = nueva_empresa
            print(f"Añadida empresa: {empresa.name}")
        else:
            # Si ya existe, borrar precios antiguos
            precios = db.query(StockPrice).filter(StockPrice.company_id == empresa.id).first()
            if precios:
                print(f"Borrando precios antiguos de {empresa.name}")
                db.query(StockPrice).filter(StockPrice.company_id == empresa.id).delete()
                db.commit()

        # Fijar semilla para generar datos consistentes
        random.seed(empresa.id * 1000)

        # Precio inicial aleatorio
        precio_base = random.uniform(100, 500)
        dias = 365  # Un año de datos
        
        # Generar precio para cada día
        for i in range(dias):
            # Variación diaria entre -2.5% y 2.5%
            variacion = (random.random() - 0.5) * 0.05
            precio = precio_base * (1 + variacion)
            
            # Cada 30 días simular eventos grandes
            if i % 30 == 0 and i > 0:
                evento_grande = (random.random() - 0.5) * 0.15
                precio = precio * (1 + evento_grande)
            
            # No permitir precios menores a 20€
            if precio < 20:
                precio = 20
            
            # Guardar el precio en la base de datos
            nuevo_precio = StockPrice(
                company_id=empresa.id,
                timestamp=datetime.utcnow() - timedelta(days=dias - i),
                price=round(precio, 2)
            )
            db.add(nuevo_precio)
            
            # El precio de mañana parte del precio de hoy
            precio_base = precio

        # Resetear la semilla aleatoria
        random.seed()
        db.commit()
    
    # Cerrar conexión
    db.close()

initialize_default_companies()

def initialize_default_news():
    # Conectar a la base de datos
    db = SessionLocal()
    
    # Verificar si ya hay noticias
    contador_noticias = db.query(News).count()
    if contador_noticias > 0:
        print(f"Ya hay {contador_noticias} noticias en la base de datos")
        db.close()
        return
    
    # Buscar usuario admin
    admin = db.query(User).filter(User.email == "admin@admin").first()
    
    # Si no existe, crear el usuario admin
    if not admin:
        print("No existe el usuario admin, creándolo ahora")
        from passlib.hash import bcrypt
        admin = User(
            email="admin@admin", 
            hashed_password=bcrypt.hash("admin")
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Usuario admin creado")
    
    # Fechas para las noticias
    fechas = [
        datetime.utcnow() - timedelta(days=2),
        datetime.utcnow() - timedelta(days=5),
        datetime.utcnow() - timedelta(days=8),
        datetime.utcnow() - timedelta(days=15),
        datetime.utcnow() - timedelta(days=21),
        datetime.utcnow() - timedelta(days=30)
    ]
    
    # Lista de noticias
    noticias = [
        {
            "title": "El IBEX 35 alcanza máximos anuales impulsado por el sector bancario",
            "content": "El principal indicador de la bolsa española ha superado los 11.000 puntos por primera vez en este año, con el sector bancario liderando las ganancias gracias a las expectativas de recortes de tipos de interés por parte del BCE.",
            "url": "https://elpais.com/economia/2023/bolsa-mercados/ibex-35-maximo-anual.html",
            "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[0],
            "updated_at": fechas[0]
        },
        {
            "title": "La Unión Europea aprueba nuevas regulaciones para criptomonedas",
            "content": "El Parlamento Europeo ha aprobado el reglamento MiCA (Markets in Crypto-Assets), que establecerá un marco regulatorio completo para los activos digitales en toda la UE, con el objetivo de proteger a los inversores y garantizar la estabilidad financiera.",
            "url": "https://ec.europa.eu/commission/presscorner/detail/es/ip_23_1111",
            "image_url": "https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1469&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[1],
            "updated_at": fechas[1]
        },
        {
            "title": "Telefónica anuncia un plan de inversión de 5.000 millones para infraestructura 5G",
            "content": "La operadora española ha presentado su estrategia para los próximos cinco años, que incluye una importante inversión en infraestructura 5G y fibra óptica en España y Latinoamérica, con el objetivo de liderar la transformación digital en estos mercados.",
            "url": "https://www.telefonica.com/es/sala-comunicacion/telefonica-plan-inversion-5g/",
            "image_url": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1470&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[2],
            "updated_at": fechas[2]
        },
        {
            "title": "El Bitcoin supera los 50.000 dólares tras la aprobación de ETFs",
            "content": "La principal criptomoneda ha vuelto a superar la barrera psicológica de los 50.000 dólares después de que la SEC de Estados Unidos aprobara varios ETFs de Bitcoin al contado, lo que ha aumentado el interés institucional en el activo digital.",
            "url": "https://www.coindesk.com/markets/2023/bitcoin-price-etf-approval/",
            "image_url": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1469&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[3],
            "updated_at": fechas[3]
        },
        {
            "title": "La FED mantiene tipos de interés pero señala posibles recortes para el segundo semestre",
            "content": "La Reserva Federal de Estados Unidos ha decidido mantener los tipos de interés en su última reunión, pero ha indicado que podría comenzar a recortarlos en la segunda mitad del año si la inflación continúa moderándose, lo que ha sido bien recibido por los mercados.",
            "url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230614a.htm",
            "image_url": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1470&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[4],
            "updated_at": fechas[4]
        },
        {
            "title": "Iberdrola invertirá 47.000 millones en energías renovables hasta 2030",
            "content": "La compañía energética española ha anunciado un ambicioso plan de inversión en energías renovables para la próxima década, con el objetivo de triplicar su capacidad instalada y liderar la transición energética en Europa y América del Norte.",
            "url": "https://www.iberdrola.com/sala-comunicacion/noticias/plan-estrategico-2030",
            "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1470&auto=format&fit=crop",
            "created_by": admin.id,
            "created_at": fechas[5],
            "updated_at": fechas[5]
        }
    ]
    
    # Agregar cada noticia
    for datos_noticia in noticias:
        noticia = News(**datos_noticia)
        db.add(noticia)
    
    # Guardar cambios
    try:
        db.commit()
        print(f"¡Se han creado {len(noticias)} noticias!")
    except Exception as e:
        db.rollback()
        print(f"Error al crear noticias: {e}")
    
    # Cerrar conexión
    db.close()

initialize_default_news()

# Rutas base
@app.get("/")
async def root():
    return {"message": "API del simulador de bolsa funcionando correctamente"}

@app.get("/transacciones/comprar/test")
async def test_comprar():
    return {"message": "Endpoint de compra accesible"}