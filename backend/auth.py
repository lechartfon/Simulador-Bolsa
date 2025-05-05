from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from database import SessionLocal
from passlib.hash import bcrypt
from pydantic import BaseModel

router = APIRouter()

class RegisterSchema(BaseModel):
    email: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    hashed_pw = bcrypt.hash(data.password)
    new_user = User(email=data.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    return {"message": "Usuario registrado"}

@router.post("/login")
def login(data: RegisterSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not bcrypt.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    return {"message": "Login exitoso"}
