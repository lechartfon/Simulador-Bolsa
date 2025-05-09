from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import StockPrice, Company
from ..services.stock_data import generate_historical_data
import datetime

router = APIRouter()

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