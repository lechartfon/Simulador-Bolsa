from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .models import User, Wallet
from .database import SessionLocal
from passlib.hash import bcrypt
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()  # Carga variables del .env

router = APIRouter()

class RegisterSchema(BaseModel):
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SECRET_KEY = os.getenv("SECRET_KEY", "un_secreto_muy_seguro_por_defecto")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logging.info(f"Token generado para {data.get('sub')} con expiración {expire}")
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.info(f"Token verificado para {payload.get('sub')}")
        return payload
    except JWTError as e:
        logging.error(f"Error al verificar token: {str(e)}")
        return None

# Configuración correcta del esquema OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logging.info(f"Verificando token: {token[:10]}...")
    payload = verify_token(token)
    if not payload:
        logging.error("Token inválido o expirado")
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = payload.get("sub")
    if not email:
        logging.error("Token sin email")
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        logging.error(f"Usuario no encontrado: {email}")
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    logging.info(f"Usuario autenticado: {user.email}")
    return user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.email != "admin@admin":
        logging.error(f"Usuario {current_user.email} intentó acceder a una función de administrador")
        raise HTTPException(
            status_code=403,
            detail="Esta función solo está disponible para administradores"
        )
    return current_user

@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    try:
        # Verificar si el usuario ya existe
        user = db.query(User).filter(User.email == data.email).first()
        if user:
            raise HTTPException(status_code=400, detail="Email ya registrado")
        
        # Crear el usuario
        hashed_pw = bcrypt.hash(data.password)
        new_user = User(email=data.email, hashed_password=hashed_pw)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Crear una billetera para el nuevo usuario
        wallet = Wallet(user_id=new_user.id, balance=50000)
        db.add(wallet)
        db.commit()
        
        logging.info(f"Usuario registrado: {data.email} con billetera inicial de 50,000")
        return {"message": "Usuario registrado con éxito, billetera creada con 50,000"}
    except Exception as e:
        db.rollback()
        logging.error(f"Error al registrar usuario: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error al registrar usuario: {str(e)}")

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    logging.info(f"Intento de login para usuario: {data.username}")
    user = db.query(User).filter(User.email == data.username).first()
    if not user:
        logging.error(f"Usuario no encontrado: {data.username}")
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    
    if not bcrypt.verify(data.password, user.hashed_password):
        logging.error(f"Contraseña incorrecta para usuario: {data.username}")
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    
    # Verificar si el usuario tiene billetera
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        # Crear billetera si no existe
        logging.warning(f"Creando billetera para usuario existente: {user.email}")
        wallet = Wallet(user_id=user.id, balance=50000)
        db.add(wallet)
        db.commit()
        
    token_data = {"sub": user.email}
    token = create_access_token(data=token_data)
    logging.info(f"Login exitoso para usuario: {data.username}")
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email
        }
    }
