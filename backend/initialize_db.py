from .database import Base, engine
from .models import Company, User, StockPrice, Wallet, Transaction, Classroom, ClassroomMembership

# Crear todas las tablas definidas en los modelos
if __name__ == "__main__":
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")