import logging
import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config import INITIAL_BALANCE, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, require_jwt_secret
from database import get_db
from models import User, Wallet

logger = logging.getLogger(__name__)
router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterSchema(BaseModel):
    email: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class LoginSchema(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=1, max_length=128)


def _secret() -> str:
    return require_jwt_secret()


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _secret(), algorithm=JWT_ALGORITHM)


def verify_token(token: str):
    try:
        return jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


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
    if getattr(current_user, "role", "user") != "admin":
        raise HTTPException(status_code=403, detail="Esta función solo está disponible para administradores")
    return current_user


def _validate_email(email: str) -> str:
    normalized = email.strip().lower()
    if not EMAIL_RE.match(normalized):
        raise HTTPException(status_code=400, detail="Email no válido")
    return normalized


@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    email = _validate_email(data.email)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo_usuario = User(email=email, hashed_password=bcrypt.hash(data.password), role="user")
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    billetera = Wallet(user_id=nuevo_usuario.id, balance=INITIAL_BALANCE)
    db.add(billetera)
    db.commit()

    logger.info("Usuario registrado: id=%s", nuevo_usuario.id)
    return {"message": "Usuario registrado con éxito"}


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    email = data.username.strip().lower()
    usuario = db.query(User).filter(User.email == email).first()
    if not usuario or not bcrypt.verify(data.password, usuario.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")

    billetera = db.query(Wallet).filter(Wallet.user_id == usuario.id).first()
    if not billetera:
        billetera = Wallet(user_id=usuario.id, balance=INITIAL_BALANCE)
        db.add(billetera)
        db.commit()

    token = create_access_token(data={"sub": usuario.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": usuario.id, "email": usuario.email, "role": usuario.role},
    }
