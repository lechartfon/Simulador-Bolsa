from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import StockPrice, Company, Wallet, Transaction, TransactionType
import datetime
from pydantic import BaseModel
from ..auth import get_current_user, verify_token
from .. import models
import logging
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Dict, Any, List
import traceback
from decimal import Decimal
from sqlalchemy import desc, func, text

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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
    """
    Obtiene el saldo actual de la billetera del usuario autenticado.
    Si el usuario no tiene billetera, crea una con saldo inicial.
    """
    try:
        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        
        # Si no existe una billetera, crear una nueva
        if not wallet:
            logging.info(f"Creando nueva billetera para usuario: {user.id}")
            wallet = Wallet(user_id=user.id, balance=50000)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        
        # Convertir a float para la respuesta
        balance = float(wallet.balance)
        return {
            "balance": balance,
            "user_id": user.id
        }
    
    except Exception as e:
        logging.error(f"Error al obtener billetera: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error al obtener balance: {str(e)}")

@router.get("/stocks/{company_name}")
def get_stock_data(company_name: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.name == company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    prices = db.query(StockPrice).filter(StockPrice.company_id == company.id).order_by(StockPrice.timestamp).all()

    # Formatear los datos para que sean compatibles con Highcharts
    formatted_prices = [
        [int(price.timestamp.timestamp() * 1000), price.price] for price in prices
    ]

    return JSONResponse(content=formatted_prices)

@router.get("/empresas")
def get_empresas():
    db = SessionLocal()
    empresas = db.query(Company).all()
    result = [{"id": empresa.id, "symbol": empresa.symbol, "name": empresa.name} for empresa in empresas]
    db.close()
    return result

# Endpoint para la compra de acciones - múltiples rutas para mayor accesibilidad
@router.post("/transacciones/comprar")
@router.post("/comprar")
async def comprar_accion(
    compra: CompraRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # Verificar el token manualmente para ver qué pasa
        logging.info(f"Token recibido en comprar: {token[:20]}...")
        payload = verify_token(token)
        if not payload:
            logging.error("Token inválido o expirado en comprar")
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        email = payload.get("sub")
        if not email:
            logging.error("Token sin email en comprar")
            raise HTTPException(status_code=401, detail="Token inválido")

        logging.info(f"Buscando usuario con email: {email}")
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            logging.error(f"Usuario no encontrado para email: {email}")
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        logging.info(f"Usuario encontrado: {user.id} - {user.email}")
        
        # Verificar que la compañía existe
        logging.info(f"Verificando que la compañía existe: {compra.company_id}")
        company = db.query(Company).filter(Company.id == compra.company_id).first()
        if not company:
            logging.error(f"Compañía no encontrada: {compra.company_id}")
            raise HTTPException(status_code=404, detail=f"Compañía no encontrada con ID: {compra.company_id}")
        
        logging.info(f"Compañía encontrada: {company.id} - {company.name}")
        
        # Resto del código para la compra
        logging.info(f"Recibida solicitud de compra: {compra}")
        # Obtener el saldo del usuario
        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()

        if not wallet:
            logging.info(f"No se encontró billetera para usuario ID: {user.id}, creando una nueva.")
            
            # Crear billetera automáticamente si no existe
            wallet = Wallet(user_id=user.id, balance=50000)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
            logging.info(f"Billetera creada automáticamente para usuario: {user.email} con saldo: {wallet.balance}")

        # Convertir precio_per_share a Decimal para evitar errores de tipo
        price_per_share_decimal = Decimal(str(compra.price_per_share))
        
        # Calcular el precio total
        price_total = Decimal(compra.quantity) * price_per_share_decimal
        logging.info(f"Precio total de la compra: {price_total}, Saldo disponible: {wallet.balance}")

        if wallet.balance < price_total:
            logging.error(f"Saldo insuficiente. User ID: {user.id}, Balance: {wallet.balance}, Requerido: {price_total}")
            raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Disponible: {wallet.balance}, Requerido: {price_total}")

        # Crear la transacción
        try:
            transaction = Transaction(
                user_id=user.id,
                company_id=compra.company_id,
                type=TransactionType.buy,
                quantity=compra.quantity,
                price_per_share=price_per_share_decimal
            )
            
            # Guardar la transacción
            db.add(transaction)
            
            # Restar el dinero de la billetera
            wallet.balance = wallet.balance - price_total
            
            db.commit()
            db.refresh(transaction)
            
            logging.info(f"Transacción exitosa para usuario ID: {user.id}, ID transacción: {transaction.id}")
            return {
                "mensaje": "Compra realizada con éxito", 
                "transacción": transaction.id,
                "detalles": {
                    "empresa": company.name,
                    "cantidad": compra.quantity,
                    "precio_unitario": float(price_per_share_decimal),
                    "precio_total": float(price_total),
                    "saldo_restante": float(wallet.balance)
                }
            }
        except Exception as transaction_error:
            db.rollback()
            logging.error(f"Error al crear la transacción: {str(transaction_error)}")
            logging.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error al crear la transacción: {str(transaction_error)}")

    except HTTPException as http_exc:
        # Re-lanzar excepciones HTTP que ya tienen un código de estado definido
        raise http_exc
    except Exception as e:
        # Capturar y registrar cualquier otro error
        db.rollback()
        error_msg = f"Error al procesar la compra: {str(e)}"
        stack_trace = traceback.format_exc()
        logging.error(error_msg)
        logging.error(stack_trace)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/transacciones/vender")
@router.post("/vender")
async def vender_accion(
    venta: VentaRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        logging.info(f"Recibida solicitud de venta para usuario ID: {user.id}")
        
        # Verificar que la compañía existe
        company = db.query(Company).filter(Company.id == venta.company_id).first()
        if not company:
            logging.error(f"Compañía no encontrada: {venta.company_id}")
            raise HTTPException(status_code=404, detail=f"Compañía no encontrada con ID: {venta.company_id}")
        
        logging.info(f"Compañía encontrada: {company.id} - {company.name}")
        
        # Verificar que el usuario tiene suficientes acciones para vender
        # Consultar las transacciones para calcular cuántas acciones tiene
        stmt = text("""
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END), 0) as total_bought,
                COALESCE(SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END), 0) as total_sold
            FROM 
                transactions
            WHERE 
                user_id = :user_id AND company_id = :company_id
        """)
        
        result = db.execute(stmt, {"user_id": user.id, "company_id": venta.company_id}).first()
        
        if not result:
            logging.error(f"No se encontraron transacciones previas para user_id: {user.id}, company_id: {venta.company_id}")
            raise HTTPException(status_code=400, detail="No tienes acciones de esta empresa para vender")
        
        total_bought = result[0]
        total_sold = result[1]
        available_shares = total_bought - total_sold
        
        if available_shares < venta.quantity:
            logging.error(f"Acciones insuficientes. User ID: {user.id}, Disponibles: {available_shares}, Solicitadas: {venta.quantity}")
            raise HTTPException(status_code=400, detail=f"Acciones insuficientes. Disponibles: {available_shares}, Solicitadas: {venta.quantity}")
        
        # Obtener la billetera del usuario
        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        if not wallet:
            logging.error(f"No se encontró billetera para usuario ID: {user.id}")
            raise HTTPException(status_code=404, detail="Billetera no encontrada")
        
        price_per_share_decimal = Decimal(str(venta.price_per_share))
        
        # Calcular el precio total de venta
        price_total = Decimal(venta.quantity) * price_per_share_decimal
        
        # Crear la transacción de venta
        try:
            transaction = Transaction(
                user_id=user.id,
                company_id=venta.company_id,
                type=TransactionType.sell,
                quantity=venta.quantity,
                price_per_share=price_per_share_decimal
            )
            
            db.add(transaction)
            
            wallet.balance = wallet.balance + price_total
            
            db.commit()
            db.refresh(transaction)
            
            logging.info(f"Venta exitosa para usuario ID: {user.id}, ID transacción: {transaction.id}")
            return {
                "mensaje": "Venta realizada con éxito", 
                "transacción": transaction.id,
                "detalles": {
                    "empresa": company.name,
                    "cantidad": venta.quantity,
                    "precio_unitario": float(price_per_share_decimal),
                    "precio_total": float(price_total),
                    "saldo_actualizado": float(wallet.balance)
                }
            }
        except Exception as transaction_error:
            db.rollback()
            logging.error(f"Error al crear la transacción de venta: {str(transaction_error)}")
            logging.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error al crear la transacción de venta: {str(transaction_error)}")
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        error_msg = f"Error al procesar la venta: {str(e)}"
        stack_trace = traceback.format_exc()
        logging.error(error_msg)
        logging.error(stack_trace)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/transacciones", response_model=List[Dict[str, Any]])
async def get_user_transactions(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Obtener todas las transacciones del usuario
        transactions = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(desc(Transaction.timestamp)).all()
        
        result = []
        for t in transactions:
            company = db.query(Company).filter(Company.id == t.company_id).first()
            company_name = company.name if company else "Desconocida"
            company_symbol = company.symbol if company else ""
            
            total_price = float(t.price_per_share) * t.quantity
            
            result.append({
                "id": t.id,
                "company_name": company_name,
                "company_symbol": company_symbol,
                "type": t.type.value,
                "quantity": t.quantity,
                "price_per_share": float(t.price_per_share),
                "timestamp": t.timestamp,
                "total_price": total_price
            })
        
        return result
    
    except Exception as e:
        error_msg = f"Error al obtener transacciones: {str(e)}"
        logging.error(error_msg)
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/portfolio", response_model=List[Dict[str, Any]])
async def get_user_portfolio(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        all_transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
        
        portfolio_dict = {}
        
        for transaction in all_transactions:
            company_id = transaction.company_id
            
            if company_id not in portfolio_dict:
                portfolio_dict[company_id] = {
                    "total_bought": 0,
                    "total_sold": 0,
                    "buy_value": 0
                }
            
            # Actualizar cantidades según tipo de transacción
            if transaction.type == TransactionType.buy:
                portfolio_dict[company_id]["total_bought"] += transaction.quantity
                portfolio_dict[company_id]["buy_value"] += float(transaction.price_per_share) * transaction.quantity
            else:  
                portfolio_dict[company_id]["total_sold"] += transaction.quantity
        
        result = []
        
        for company_id, data in portfolio_dict.items():
            shares_owned = data["total_bought"] - data["total_sold"]
            
            # Solo incluir empresas donde aún tenemos acciones
            if shares_owned <= 0:
                continue
            
            # Obtener información de la empresa
            company = db.query(Company).filter(Company.id == company_id).first()
            if not company:
                continue
            
            # Calcular precio promedio de compra
            avg_purchase_price = 0
            if data["total_bought"] > 0:
                avg_purchase_price = data["buy_value"] / data["total_bought"]
            
            latest_price = db.query(StockPrice).filter(
                StockPrice.company_id == company_id
            ).order_by(desc(StockPrice.timestamp)).first()
            
            current_price = latest_price.price if latest_price else 0
            
            total_value = current_price * shares_owned
            profit_loss = (current_price - avg_purchase_price) * shares_owned
            profit_loss_percent = ((current_price / avg_purchase_price) - 1) * 100 if avg_purchase_price > 0 else 0
            
            result.append({
                "company_id": company_id,
                "company_name": company.name,
                "company_symbol": company.symbol,
                "shares_owned": shares_owned,
                "avg_purchase_price": avg_purchase_price,
                "current_price": current_price,
                "total_value": total_value,
                "profit_loss": profit_loss,
                "profit_loss_percent": profit_loss_percent
            })
        
        return result
    
    except Exception as e:
        error_msg = f"Error al obtener portafolio: {str(e)}"
        logging.error(error_msg)
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)