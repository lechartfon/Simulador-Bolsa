from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Classroom, ClassroomMembership, Wallet, Transaction, StockPrice
from ..auth import get_current_user
from pydantic import BaseModel
import logging
import random
import string
from typing import List, Optional
from sqlalchemy import desc, func, text
from decimal import Decimal
import traceback
from sqlalchemy.sql import select

router = APIRouter()

# Modelos Pydantic para validación de datos
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
    initial_investment: float = 50000  # Valor inicial de cada cartera
    current_value: float
    profit_percentage: float

# Función para generar códigos de clase aleatorios
def generate_classroom_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Crear una nueva clase
@router.post("/classrooms", response_model=ClassroomResponse)
async def create_classroom(
    data: ClassroomCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Generar un código único
        code = generate_classroom_code()
        while db.query(Classroom).filter(Classroom.code == code).first():
            code = generate_classroom_code()
        
        # Crear la clase
        new_classroom = Classroom(
            name=data.name,
            code=code,
            creator_id=user.id
        )
        db.add(new_classroom)
        db.commit()
        db.refresh(new_classroom)
        
        # Añadir al creador como miembro profesor
        membership = ClassroomMembership(
            user_id=user.id,
            classroom_id=new_classroom.id,
            is_teacher=True
        )
        db.add(membership)
        db.commit()
        
        # Contar miembros
        member_count = db.query(ClassroomMembership).filter(
            ClassroomMembership.classroom_id == new_classroom.id
        ).count()
        
        return {
            "id": new_classroom.id,
            "name": new_classroom.name,
            "code": new_classroom.code,
            "creator_id": new_classroom.creator_id,
            "member_count": member_count
        }
    except Exception as e:
        db.rollback()
        logging.error(f"Error al crear clase: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al crear clase: {str(e)}")

# Unirse a una clase existente
@router.post("/classrooms/join")
async def join_classroom(
    data: ClassroomJoin,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Buscar la clase por código
        classroom = db.query(Classroom).filter(Classroom.code == data.code).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Clase no encontrada")
        
        # Verificar si ya es miembro
        existing_membership = db.query(ClassroomMembership).filter(
            ClassroomMembership.user_id == user.id,
            ClassroomMembership.classroom_id == classroom.id
        ).first()
        
        if existing_membership:
            raise HTTPException(status_code=400, detail="Ya eres miembro de esta clase")
        
        # Crear membresía
        membership = ClassroomMembership(
            user_id=user.id,
            classroom_id=classroom.id,
            is_teacher=False
        )
        db.add(membership)
        db.commit()
        
        return {"message": f"Te has unido a la clase {classroom.name}"}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        logging.error(f"Error al unirse a la clase: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al unirse a la clase: {str(e)}")

# Obtener clases en las que el usuario es miembro
@router.get("/classrooms/my", response_model=List[ClassroomResponse])
async def get_my_classrooms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Obtener todas las membresías del usuario
        memberships = db.query(ClassroomMembership).filter(
            ClassroomMembership.user_id == user.id
        ).all()
        
        result = []
        for membership in memberships:
            classroom = db.query(Classroom).filter(
                Classroom.id == membership.classroom_id
            ).first()
            
            if classroom:
                # Contar miembros
                member_count = db.query(ClassroomMembership).filter(
                    ClassroomMembership.classroom_id == classroom.id
                ).count()
                
                result.append({
                    "id": classroom.id,
                    "name": classroom.name,
                    "code": classroom.code,
                    "creator_id": classroom.creator_id,
                    "member_count": member_count
                })
        
        return result
    except Exception as e:
        logging.error(f"Error al obtener clases: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al obtener clases: {str(e)}")

# Obtener la tabla de clasificación para una clase
@router.get("/classrooms/{classroom_id}/leaderboard", response_model=List[MemberPerformance])
async def get_classroom_leaderboard(
    classroom_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario es miembro de la clase
        membership = db.query(ClassroomMembership).filter(
            ClassroomMembership.user_id == user.id,
            ClassroomMembership.classroom_id == classroom_id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=403, detail="No eres miembro de esta clase")
        
        # Obtener todos los miembros de la clase
        members = db.query(ClassroomMembership).filter(
            ClassroomMembership.classroom_id == classroom_id
        ).all()
        
        result = []
        for member in members:
            # Obtener usuario
            user_data = db.query(User).filter(User.id == member.user_id).first()
            if not user_data:
                continue
            
            # Obtener wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == member.user_id).first()
            if not wallet:
                continue
            
            # Calcular el valor total (saldo + valor de acciones compradas)
            balance = float(wallet.balance)
            
            # Consultar las transacciones para calcular el valor actual de las acciones
            # Agrupar por compañía y tipo para obtener la cantidad neta de acciones
            stmt = text("""
                SELECT 
                    t.company_id,
                    CASE WHEN t.type = 'buy' THEN SUM(t.quantity) ELSE -SUM(t.quantity) END as net_quantity
                FROM 
                    transactions as t
                WHERE 
                    t.user_id = :user_id
                GROUP BY 
                    t.company_id, t.type
            """)
            
            result_proxy = db.execute(stmt, {"user_id": member.user_id})
            
            # Crear un diccionario para almacenar la cantidad neta por compañía
            stock_quantities = {}
            for row in result_proxy:
                company_id = row[0]
                net_quantity = row[1]
                
                if company_id not in stock_quantities:
                    stock_quantities[company_id] = 0
                    
                stock_quantities[company_id] += net_quantity
            
            # Obtener los precios actuales de las acciones
            stock_value = 0
            for company_id, quantity in stock_quantities.items():
                if quantity <= 0:
                    continue
                
                # Obtener el último precio registrado
                latest_price = db.query(StockPrice).filter(
                    StockPrice.company_id == company_id
                ).order_by(desc(StockPrice.timestamp)).first()
                
                if latest_price:
                    price = float(latest_price.price)
                    qty = float(quantity)
                    stock_value += price * qty
            
            # Calcular valor total y porcentaje de ganancia
            total_value = balance + stock_value
            profit_percentage = ((total_value - 50000) / 50000) * 100
            
            result.append({
                "user_id": user_data.id,
                "email": user_data.email,
                "initial_investment": 50000,
                "current_value": round(total_value, 2),
                "profit_percentage": round(profit_percentage, 2)
            })
        
        # Ordenar por porcentaje de ganancia (de mayor a menor)
        result.sort(key=lambda x: x["profit_percentage"], reverse=True)
        
        return result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logging.error(f"Error al obtener tabla de clasificación: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al obtener tabla de clasificación: {str(e)}") 