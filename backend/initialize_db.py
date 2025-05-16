import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from database import Base, engine
from models import Company, User, StockPrice, Wallet, Transaction, Classroom, ClassroomMembership

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
    
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')
    
    print(f"Verificando conexión a MySQL como {db_user}@{db_host}...")
    
    root_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}"
    temp_engine = create_engine(root_url, echo=True)
    
    with temp_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
        print(f"Base de datos '{db_name}' creada o verificada exitosamente.")
    
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")