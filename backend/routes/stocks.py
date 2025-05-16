from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import StockPrice, Company, Wallet, Transaction, TransactionType
import datetime
import random
from pydantic import BaseModel
from auth import get_current_user
import models
from typing import Optional, Dict, Any, List
from decimal import Decimal
from sqlalchemy import desc, text

# Crear el router para manejar las rutas de acciones
router = APIRouter()

class CompraRequest(BaseModel):
    company_id: int
    quantity: int
    price_per_share: float

class VentaRequest(BaseModel):
    company_id: int
    quantity: int
    price_per_share: float

class WalletResponse(BaseModel):
    balance: float
    user_id: int

class TransactionResponse(BaseModel):
    id: int
    company_name: str
    company_symbol: Optional[str]
    type: str
    quantity: int
    price_per_share: float
    timestamp: datetime.datetime
    total_price: float

@router.get("/wallet", response_model=Dict[str, Any])
async def get_wallet_balance(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buscar la billetera del usuario
    billetera = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    
    # Si no existe billetera, crear una
    if not billetera:
        print(f"Creando billetera para usuario: {user.email}")
        billetera = Wallet(user_id=user.id, balance=50000)
        db.add(billetera)
        db.commit()
        db.refresh(billetera)
    
    return {
        "balance": float(billetera.balance),
        "user_id": user.id
    }

@router.get("/stocks/{company_name}")
def get_stock_data(company_name: str, db: Session = Depends(get_db)):
    empresa = db.query(Company).filter(Company.name == company_name).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    precios = db.query(StockPrice).filter(
        StockPrice.company_id == empresa.id
    ).order_by(StockPrice.timestamp).all()

    hoy = datetime.datetime.utcnow().date()
    hay_precio_hoy = False
    ultimo_precio = 0
    
    if precios:
        ultimo = precios[-1]
        ultimo_precio = ultimo.price
        hay_precio_hoy = ultimo.timestamp.date() == hoy
    
    if not hay_precio_hoy and precios:
        variacion = random.uniform(-0.02, 0.02)  
        nuevo_precio = ultimo_precio * (1 + variacion)
        
        precio_hoy = StockPrice(
            company_id=empresa.id,
            timestamp=datetime.datetime.utcnow(),
            price=round(nuevo_precio, 2)
        )
        
        # Guardar en base de datos
        db.add(precio_hoy)
        db.commit()
        
        precios.append(precio_hoy)

    # Formato para gráfico
    datos_formateados = []
    for precio in precios:
        tiempo = int(precio.timestamp.timestamp() * 1000)
        datos_formateados.append([tiempo, precio.price])

    return JSONResponse(content=datos_formateados)

@router.get("/empresas")
def get_empresas():
    db = SessionLocal()
    
    empresas = db.query(Company).all()
    
    lista_empresas = []
    for empresa in empresas:
        lista_empresas.append({
            "id": empresa.id,
            "symbol": empresa.symbol,
            "name": empresa.name
        })
    
    db.close()
    
    return lista_empresas

# Endpoint para comprar acciones
@router.post("/transacciones/comprar")
@router.post("/comprar")
async def comprar_accion(
    compra: CompraRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buscar la empresa que quiere comprar
    empresa = db.query(Company).filter(Company.id == compra.company_id).first()
    if not empresa:
        print(f"No existe la empresa con ID {compra.company_id}")
        raise HTTPException(status_code=404, detail="No encontramos esa empresa")
    
    billetera = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    
    # Si no existe billetera, crear una nueva
    if not billetera:
        print(f"Usuario {user.email} no tiene billetera, creando una nueva")
        billetera = Wallet(user_id=user.id, balance=50000)
        db.add(billetera)
        db.commit()
        db.refresh(billetera)
    
    # Convertir el precio a Decimal para evitar problemas
    precio_por_accion = Decimal(str(compra.price_per_share))
    
    costo_total = precio_por_accion * Decimal(compra.quantity)
    
    if billetera.balance < costo_total:
        print(f"Usuario {user.email} no tiene suficiente dinero para comprar")
        raise HTTPException(
            status_code=400, 
            detail=f"No tienes suficiente dinero. Tienes {billetera.balance} pero necesitas {costo_total}"
        )
    
    # Crear la transacción
    transaccion = Transaction(
        user_id=user.id,
        company_id=compra.company_id,
        type=TransactionType.buy,
        quantity=compra.quantity,
        price_per_share=precio_por_accion
    )
    
    db.add(transaccion)
    
    billetera.balance = billetera.balance - costo_total
    
    db.commit()
    
    return {
        "mensaje": f"¡Has comprado {compra.quantity} acciones de {empresa.name}!", 
        "transacción": transaccion.id,
        "detalles": {
            "empresa": empresa.name,
            "cantidad": compra.quantity,
            "precio_por_accion": float(precio_por_accion),
            "costo_total": float(costo_total),
            "dinero_restante": float(billetera.balance)
        }
    }

@router.post("/transacciones/vender")
@router.post("/vender")
async def vender_accion(
    venta: VentaRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    empresa = db.query(Company).filter(Company.id == venta.company_id).first()
    if not empresa:
        print(f"No existe la empresa con ID {venta.company_id}")
        raise HTTPException(status_code=404, detail="No encontramos esa empresa")
    
    # Esta consulta SQL cuenta cuántas acciones compró y vendió
    consulta = text("""
        SELECT 
            SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END) as compradas,
            SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END) as vendidas
        FROM 
            transactions
        WHERE 
            user_id = :user_id AND company_id = :company_id
    """)
    
    resultado = db.execute(consulta, {"user_id": user.id, "company_id": venta.company_id}).first()
    
    # Si no hay resultado, no tiene acciones
    if not resultado or not resultado[0]:
        print(f"El usuario {user.email} no tiene acciones de {empresa.name}")
        raise HTTPException(status_code=400, detail="No tienes acciones de esta empresa para vender")
    
    acciones_compradas = resultado[0] or 0
    acciones_vendidas = resultado[1] or 0
    acciones_disponibles = acciones_compradas - acciones_vendidas
    
    # Comprobar si tiene suficientes acciones
    if acciones_disponibles < venta.quantity:
        print(f"El usuario quiere vender {venta.quantity} pero solo tiene {acciones_disponibles}")
        raise HTTPException(
            status_code=400, 
            detail=f"No tienes suficientes acciones. Tienes {acciones_disponibles} pero quieres vender {venta.quantity}"
        )
    
    billetera = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not billetera:
        billetera = Wallet(user_id=user.id, balance=50000)
        db.add(billetera)
        db.commit()
    
    precio_por_accion = Decimal(str(venta.price_per_share))
    
    dinero_recibido = precio_por_accion * Decimal(venta.quantity)
    
    transaccion = Transaction(
        user_id=user.id,
        company_id=venta.company_id,
        type=TransactionType.sell,
        quantity=venta.quantity,
        price_per_share=precio_por_accion
    )
    
    db.add(transaccion)
    
    billetera.balance = billetera.balance + dinero_recibido
    
    db.commit()
    
    return {
        "mensaje": f"¡Has vendido {venta.quantity} acciones de {empresa.name}! 💰", 
        "transacción": transaccion.id,
        "detalles": {
            "empresa": empresa.name,
            "cantidad": venta.quantity,
            "precio_por_accion": float(precio_por_accion),
            "dinero_recibido": float(dinero_recibido),
            "dinero_total": float(billetera.balance)
        }
    }

@router.get("/transacciones", response_model=List[Dict[str, Any]])
async def get_user_transactions(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buscar todas las transacciones del usuario
    transacciones = db.query(Transaction).filter(
        Transaction.user_id == user.id
    ).order_by(desc(Transaction.timestamp)).all()
    
    lista_transacciones = []
    
    for t in transacciones:
        empresa = db.query(Company).filter(Company.id == t.company_id).first()
        nombre_empresa = empresa.name if empresa else "Desconocida"
        simbolo_empresa = empresa.symbol if empresa else ""
        
        precio_total = float(t.price_per_share) * t.quantity
        
        # Añadir a la lista
        lista_transacciones.append({
            "id": t.id,
            "company_name": nombre_empresa,
            "company_symbol": simbolo_empresa,
            "type": t.type.value,
            "quantity": t.quantity,
            "price_per_share": float(t.price_per_share),
            "timestamp": t.timestamp,
            "total_price": precio_total
        })
    
    return lista_transacciones

@router.get("/portfolio", response_model=List[Dict[str, Any]])
async def get_user_portfolio(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transacciones = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    
    cartera = {}
    
    for t in transacciones:
        empresa_id = t.company_id
        
        if empresa_id not in cartera:
            cartera[empresa_id] = {
                "acciones_compradas": 0,
                "acciones_vendidas": 0,
                "valor_de_compra": 0
            }
        
        if t.type == TransactionType.buy:
            cartera[empresa_id]["acciones_compradas"] += t.quantity
            cartera[empresa_id]["valor_de_compra"] += float(t.price_per_share) * t.quantity
        else:  
            cartera[empresa_id]["acciones_vendidas"] += t.quantity
    
    resultado = []
    
    for empresa_id, datos in cartera.items():
        acciones_actuales = datos["acciones_compradas"] - datos["acciones_vendidas"]
        
        if acciones_actuales <= 0:
            continue
        
        empresa = db.query(Company).filter(Company.id == empresa_id).first()
        if not empresa:
            continue
        
        precio_medio_compra = 0
        if datos["acciones_compradas"] > 0:
            precio_medio_compra = datos["valor_de_compra"] / datos["acciones_compradas"]
        
        ultimo_precio_obj = db.query(StockPrice).filter(
            StockPrice.company_id == empresa_id
        ).order_by(desc(StockPrice.timestamp)).first()
        
        if ultimo_precio_obj:
            hoy = datetime.datetime.utcnow().date()
            if ultimo_precio_obj.timestamp.date() != hoy:
                variacion = random.uniform(-0.02, 0.02)
                nuevo_valor = ultimo_precio_obj.price * (1 + variacion)
                
                nuevo_precio = StockPrice(
                    company_id=empresa_id,
                    timestamp=datetime.datetime.utcnow(),
                    price=round(nuevo_valor, 2)
                )
                
                db.add(nuevo_precio)
                db.commit()
                
                ultimo_precio_obj = nuevo_precio
        
        precio_actual = ultimo_precio_obj.price if ultimo_precio_obj else 0
        
        valor_total = precio_actual * acciones_actuales
        ganancia_perdida = (precio_actual - precio_medio_compra) * acciones_actuales
        
        if precio_medio_compra > 0:
            porcentaje = ((precio_actual / precio_medio_compra) - 1) * 100
        else:
            porcentaje = 0
        
        resultado.append({
            "company_id": empresa_id,
            "company_name": empresa.name,
            "company_symbol": empresa.symbol,
            "shares_owned": acciones_actuales,
            "avg_purchase_price": precio_medio_compra,
            "current_price": precio_actual,
            "total_value": valor_total,
            "profit_loss": ganancia_perdida,
            "profit_loss_percent": porcentaje
        })
    
    return resultado