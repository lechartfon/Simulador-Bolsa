from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User, Wallet
from database import SessionLocal
from passlib.hash import bcrypt
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

# Crear el router
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

# Clave para firmar los tokens
SECRET_KEY = "***REMOVED***"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token creado para usuario: {data.get('sub')}")
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        print("Error con el token")
        return None

# Configuración de OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.email != "admin@admin":
        raise HTTPException(
            status_code=403,
            detail="Esta función solo está disponible para administradores"
        )
    return current_user

@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    usuario = db.query(User).filter(User.email == data.email).first()
    if usuario:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Crear el usuario
    password_encriptada = bcrypt.hash(data.password)
    nuevo_usuario = User(email=data.email, hashed_password=password_encriptada)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Crear una cartera para el nuevo usuario. 50.000€
    billetera = Wallet(user_id=nuevo_usuario.id, balance=50000)
    db.add(billetera)
    db.commit()
    
    print(f"Usuario registrado: {data.email}")
    return {"message": "Usuario registrado con éxito, billetera creada con 50,000"}

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == data.username).first()
    
    # Verificar si existe
    if not usuario:
        print(f"No se encontró al usuario: {data.username}")
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    
    # Verificar la contraseña
    if not bcrypt.verify(data.password, usuario.hashed_password):
        print(f"Contraseña incorrecta para: {data.username}")
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    
    # Verificar si el usuario tiene billetera
    billetera = db.query(Wallet).filter(Wallet.user_id == usuario.id).first()
    
    # Si no tiene billetera, crear una
    if not billetera:
        print(f"Creando billetera para: {usuario.email}")
        billetera = Wallet(user_id=usuario.id, balance=50000)
        db.add(billetera)
        db.commit()
        
    # Crear un token de acceso
    datos_token = {"sub": usuario.email}
    token = create_access_token(data=datos_token)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": usuario.id,
            "email": usuario.email
        }
    }
