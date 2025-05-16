from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Classroom, ClassroomMembership, Wallet, Transaction, StockPrice
from auth import get_current_user
from pydantic import BaseModel
import random
import string
from typing import List, Optional
from sqlalchemy import desc, text
from decimal import Decimal

router = APIRouter()

# Modelos para las clases
class ClassroomCreate(BaseModel):
    name: str

class ClassroomJoin(BaseModel):
    code: str

class ClassroomResponse(BaseModel):
    id: int
    name: str
    code: str
    creator_id: int
    member_count: int

class MemberPerformance(BaseModel):
    user_id: int
    email: str
    initial_investment: float = 50000 
    current_value: float  
    profit_percentage: float 

# Función para generar códigos de clase aleatorios
def generate_classroom_code(length=6):
    # Usar letras mayúsculas y números
    letras_y_numeros = string.ascii_uppercase + string.digits
    # Escoger caracteres al azar
    codigo = ''
    for i in range(length):
        codigo += random.choice(letras_y_numeros)
    return codigo

# Crear una nueva clase
@router.post("/classrooms", response_model=ClassroomResponse)
async def create_classroom(
    data: ClassroomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    codigo = generate_classroom_code()
    # Comprobar si el código ya existe
    clase_existe = db.query(Classroom).filter(Classroom.code == codigo).first()
    while clase_existe:
        print(f"El código {codigo} ya existe, generando otro")
        codigo = generate_classroom_code()
        clase_existe = db.query(Classroom).filter(Classroom.code == codigo).first()
    
    nueva_clase = Classroom(
        name=data.name,
        code=codigo,
        creator_id=user.id
    )
    
    db.add(nueva_clase)
    db.commit()
    db.refresh(nueva_clase)
    
    print(f"Clase creada: {nueva_clase.name} con código {nueva_clase.code}")
    
    # Hacer que el creador sea profesor de la clase
    membresia = ClassroomMembership(
        user_id=user.id,
        classroom_id=nueva_clase.id,
        is_teacher=True  
    )
    db.add(membresia)
    db.commit()
    
    cantidad_miembros = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == nueva_clase.id
    ).count()
    
    return {
        "id": nueva_clase.id,
        "name": nueva_clase.name,
        "code": nueva_clase.code,
        "creator_id": nueva_clase.creator_id,
        "member_count": cantidad_miembros
    }

# Unirse a una clase existente
@router.post("/classrooms/join")
async def join_classroom(
    data: ClassroomJoin,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clase = db.query(Classroom).filter(Classroom.code == data.code).first()
    
    if not clase:
        print(f"No se encontró clase con código: {data.code}")
        raise HTTPException(status_code=404, detail="No encontramos esa clase. Revisa el código.")
    
    ya_es_miembro = db.query(ClassroomMembership).filter(
        ClassroomMembership.user_id == user.id,
        ClassroomMembership.classroom_id == clase.id
    ).first()
    
    if ya_es_miembro:
        print(f"Usuario {user.email} ya es miembro de la clase {clase.name}")
        raise HTTPException(status_code=400, detail="¡Ya eres miembro de esta clase!")
    
    # Crear la membresía como estudiante
    membresia = ClassroomMembership(
        user_id=user.id,
        classroom_id=clase.id,
        is_teacher=False  
    )
    
    # Guardar en la base de datos
    db.add(membresia)
    db.commit()
    
    print(f"Usuario {user.email} se unió a la clase {clase.name}")
    
    return {"message": f"¡Te has unido a la clase {clase.name}!"}

# Obtener clases en las que el usuario es miembro
@router.get("/classrooms/my", response_model=List[ClassroomResponse])
async def get_my_classrooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membresias = db.query(ClassroomMembership).filter(
        ClassroomMembership.user_id == user.id
    ).all()
    
    mis_clases = []
    
    for membresia in membresias:
        clase = db.query(Classroom).filter(
            Classroom.id == membresia.classroom_id
        ).first()
        
        if clase:
            cantidad_miembros = db.query(ClassroomMembership).filter(
                ClassroomMembership.classroom_id == clase.id
            ).count()
            
            mis_clases.append({
                "id": clase.id,
                "name": clase.name,
                "code": clase.code,
                "creator_id": clase.creator_id,
                "member_count": cantidad_miembros
            })
    
    print(f"Usuario {user.email} tiene {len(mis_clases)} clases")
    return mis_clases

# Obtener la tabla de clasificación para una clase
@router.get("/classrooms/{classroom_id}/leaderboard", response_model=List[MemberPerformance])
async def get_classroom_leaderboard(
    classroom_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    es_miembro = db.query(ClassroomMembership).filter(
        ClassroomMembership.user_id == user.id,
        ClassroomMembership.classroom_id == classroom_id
    ).first()
    
    if not es_miembro:
        print(f"Usuario {user.email} no es miembro de la clase {classroom_id}")
        raise HTTPException(status_code=403, detail="No puedes ver esta clasificación porque no eres miembro de la clase")
    
    # Obtener todos los miembros de la clas
    miembros = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == classroom_id
    ).all()
    
    clasificacion = []
    
    # Para cada miembro, calcular su rendimiento
    for miembro in miembros:
        datos_usuario = db.query(User).filter(User.id == miembro.user_id).first()
        if not datos_usuario:
            continue
        
        billetera = db.query(Wallet).filter(Wallet.user_id == miembro.user_id).first()
        if not billetera:
            continue
        
        dinero_efectivo = float(billetera.balance)
        
        # Consulta SQL para calcular las acciones netas por empresa
        consulta = text("""
            SELECT 
                t.company_id,
                CASE WHEN t.type = 'buy' THEN SUM(t.quantity) ELSE -SUM(t.quantity) END as cantidad_neta
            FROM 
                transactions as t
            WHERE 
                t.user_id = :user_id
            GROUP BY 
                t.company_id, t.type
        """)
        
        resultado = db.execute(consulta, {"user_id": miembro.user_id})
        
        acciones_por_empresa = {}
        for fila in resultado:
            empresa_id = fila[0]
            cantidad = fila[1]
            
            if empresa_id not in acciones_por_empresa:
                acciones_por_empresa[empresa_id] = 0
                
            acciones_por_empresa[empresa_id] += cantidad
        
        valor_acciones = 0
        
        for empresa_id, cantidad in acciones_por_empresa.items():
            if cantidad <= 0:
                continue
            
            ultimo_precio = db.query(StockPrice).filter(
                StockPrice.company_id == empresa_id
            ).order_by(desc(StockPrice.timestamp)).first()
            
            if ultimo_precio:
                precio = float(ultimo_precio.price)
                valor_estas_acciones = precio * float(cantidad)
                valor_acciones += valor_estas_acciones
        
        valor_total = dinero_efectivo + valor_acciones
        
        porcentaje = ((valor_total - 50000) / 50000) * 100
        
        clasificacion.append({
            "user_id": datos_usuario.id,
            "email": datos_usuario.email,
            "initial_investment": 50000,
            "current_value": round(valor_total, 2),
            "profit_percentage": round(porcentaje, 2)
        })
    
    clasificacion.sort(key=lambda x: x["profit_percentage"], reverse=True)
    
    return clasificacion