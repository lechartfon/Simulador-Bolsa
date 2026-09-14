import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

import models
from auth import get_current_user
from config import INITIAL_BALANCE
from database import get_db
from models import Company, StockPrice, Transaction, TransactionType, Wallet

logger = logging.getLogger(__name__)
router = APIRouter()


class CompraRequest(BaseModel):
    company_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=1_000_000)


class VentaRequest(BaseModel):
    company_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=1_000_000)


def _latest_price(db: Session, company_id: int) -> Optional[StockPrice]:
    return (
        db.query(StockPrice)
        .filter(StockPrice.company_id == company_id)
        .order_by(desc(StockPrice.timestamp))
        .first()
    )


def _get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    query = db.query(Wallet).filter(Wallet.user_id == user_id)
    # SQLite (usado en tests) no soporta SELECT ... FOR UPDATE.
    if db.bind is None or getattr(db.bind, "name", None) != "sqlite":
        try:
            query = query.with_for_update()
        except Exception:
            pass
    wallet = query.first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=Decimal(str(INITIAL_BALANCE)))
        db.add(wallet)
        db.flush()
    return wallet


def _available_shares(db: Session, user_id: int, company_id: int) -> int:
    bought = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.company_id == company_id,
            Transaction.type == TransactionType.buy,
        )
        .all()
    )
    sold = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.company_id == company_id,
            Transaction.type == TransactionType.sell,
        )
        .all()
    )
    return sum(t.quantity for t in bought) - sum(t.quantity for t in sold)


@router.get("/wallet", response_model=Dict[str, Any])
async def get_wallet_balance(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        wallet = Wallet(user_id=user.id, balance=Decimal(str(INITIAL_BALANCE)))
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return {"balance": float(wallet.balance), "user_id": user.id}


@router.get("/stocks/{company_name}")
def get_stock_data(company_name: str, db: Session = Depends(get_db)):
    empresa = db.query(Company).filter(Company.name == company_name).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    precios = (
        db.query(StockPrice)
        .filter(StockPrice.company_id == empresa.id)
        .order_by(StockPrice.timestamp)
        .all()
    )
    datos = [[int(p.timestamp.timestamp() * 1000), float(p.price)] for p in precios]
    return JSONResponse(content=datos)


@router.get("/empresas")
def get_empresas(db: Session = Depends(get_db)):
    empresas = db.query(Company).order_by(Company.name).all()
    return [{"id": e.id, "symbol": e.symbol, "name": e.name} for e in empresas]


@router.post("/transacciones/comprar")
@router.post("/comprar")
async def comprar_accion(
    compra: CompraRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    empresa = db.query(Company).filter(Company.id == compra.company_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="No encontramos esa empresa")

    current = _latest_price(db, empresa.id)
    if not current:
        raise HTTPException(status_code=400, detail="Esta empresa todavía no tiene precio disponible")

    try:
        precio = Decimal(str(current.price))
        if precio <= 0:
            raise InvalidOperation("precio no positivo")
    except (InvalidOperation, ValueError, TypeError):
        raise HTTPException(status_code=500, detail="Precio no disponible")

    costo_total = precio * Decimal(compra.quantity)

    try:
        wallet = _get_or_create_wallet(db, user.id)
        if Decimal(str(wallet.balance)) < costo_total:
            db.rollback()
            raise HTTPException(status_code=400, detail="No tienes suficiente dinero para esta compra")

        transaccion = Transaction(
            user_id=user.id,
            company_id=empresa.id,
            type=TransactionType.buy,
            quantity=compra.quantity,
            price_per_share=precio,
            timestamp=datetime.utcnow(),
        )
        db.add(transaccion)
        wallet.balance = Decimal(str(wallet.balance)) - costo_total
        db.commit()
        db.refresh(transaccion)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Error al comprar acciones")
        raise HTTPException(status_code=500, detail="No se pudo completar la compra")

    return {
        "mensaje": f"¡Has comprado {compra.quantity} acciones de {empresa.name}!",
        "transaccion": transaccion.id,
        "detalles": {
            "empresa": empresa.name,
            "cantidad": compra.quantity,
            "precio_por_accion": float(precio),
            "costo_total": float(costo_total),
            "dinero_restante": float(wallet.balance),
        },
    }


@router.post("/transacciones/vender")
@router.post("/vender")
async def vender_accion(
    venta: VentaRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    empresa = db.query(Company).filter(Company.id == venta.company_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="No encontramos esa empresa")

    current = _latest_price(db, empresa.id)
    if not current:
        raise HTTPException(status_code=400, detail="Esta empresa todavía no tiene precio disponible")
    try:
        precio = Decimal(str(current.price))
        if precio <= 0:
            raise InvalidOperation("precio no positivo")
    except (InvalidOperation, ValueError, TypeError):
        raise HTTPException(status_code=500, detail="Precio no disponible")

    try:
        disponibles = _available_shares(db, user.id, empresa.id)
        if disponibles < venta.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"No tienes suficientes acciones. Tienes {disponibles} pero quieres vender {venta.quantity}",
            )

        wallet = _get_or_create_wallet(db, user.id)
        ingreso = precio * Decimal(venta.quantity)
        transaccion = Transaction(
            user_id=user.id,
            company_id=empresa.id,
            type=TransactionType.sell,
            quantity=venta.quantity,
            price_per_share=precio,
            timestamp=datetime.utcnow(),
        )
        db.add(transaccion)
        wallet.balance = Decimal(str(wallet.balance)) + ingreso
        db.commit()
        db.refresh(transaccion)
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Error al vender acciones")
        raise HTTPException(status_code=500, detail="No se pudo completar la venta")

    return {
        "mensaje": f"¡Has vendido {venta.quantity} acciones de {empresa.name}!",
        "transaccion": transaccion.id,
        "detalles": {
            "empresa": empresa.name,
            "cantidad": venta.quantity,
            "precio_por_accion": float(precio),
            "dinero_recibido": float(ingreso),
            "dinero_total": float(wallet.balance),
        },
    }


@router.get("/transacciones", response_model=List[Dict[str, Any]])
async def get_user_transactions(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transacciones = (
        db.query(Transaction)
        .options(joinedload(Transaction.company))
        .filter(Transaction.user_id == user.id)
        .order_by(desc(Transaction.timestamp))
        .all()
    )
    lista = []
    for t in transacciones:
        nombre = t.company.name if t.company else "Desconocida"
        simbolo = t.company.symbol if t.company else ""
        lista.append(
            {
                "id": t.id,
                "company_name": nombre,
                "company_symbol": simbolo,
                "type": t.type.value,
                "quantity": t.quantity,
                "price_per_share": float(t.price_per_share),
                "timestamp": t.timestamp,
                "total_price": float(t.price_per_share) * t.quantity,
            }
        )
    return lista


@router.get("/portfolio", response_model=List[Dict[str, Any]])
async def get_user_portfolio(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transacciones = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    company_ids = sorted({t.company_id for t in transacciones})
    companies = {c.id: c for c in db.query(Company).filter(Company.id.in_(company_ids)).all()} if company_ids else {}
    latest = {}
    if company_ids:
        rows = (
            db.query(StockPrice)
            .filter(StockPrice.company_id.in_(company_ids))
            .order_by(StockPrice.company_id, desc(StockPrice.timestamp))
            .all()
        )
        for r in rows:
            latest.setdefault(r.company_id, r)

    cartera: Dict[int, Dict[str, float]] = {}
    for t in transacciones:
        entry = cartera.setdefault(t.company_id, {"compradas": 0, "vendidas": 0, "coste": 0.0})
        if t.type == TransactionType.buy:
            entry["compradas"] += t.quantity
            entry["coste"] += float(t.price_per_share) * t.quantity
        else:
            entry["vendidas"] += t.quantity

    resultado = []
    for company_id, datos in cartera.items():
        actuales = datos["compradas"] - datos["vendidas"]
        if actuales <= 0:
            continue
        empresa = companies.get(company_id)
        if not empresa:
            continue
        precio_medio = datos["coste"] / datos["compradas"] if datos["compradas"] else 0
        precio_actual = float(latest[company_id].price) if company_id in latest else 0
        valor_total = precio_actual * actuales
        pnl = (precio_actual - precio_medio) * actuales
        pct = ((precio_actual / precio_medio) - 1) * 100 if precio_medio > 0 else 0
        resultado.append(
            {
                "company_id": company_id,
                "company_name": empresa.name,
                "company_symbol": empresa.symbol,
                "shares_owned": actuales,
                "avg_purchase_price": precio_medio,
                "current_price": precio_actual,
                "total_value": valor_total,
                "profit_loss": pnl,
                "profit_loss_percent": pct,
            }
        )
    return resultado
