from sqlalchemy.orm import Session
from ..models import StockPrice
import datetime
import random

def generate_historical_data(company: str, db: Session):
    existing = db.query(StockPrice).filter(StockPrice.company == company).first()
    if existing:
        return 

    now = datetime.datetime.utcnow()
    one_day = datetime.timedelta(days=1)
    time = now - datetime.timedelta(days=365)
    price = 100

    while time <= now:
        price += (random.random() - 0.5) * 0.2
        new_data = StockPrice(
            company=company,
            timestamp=time,
            price=round(price, 2)
        )
        db.add(new_data)
        time += one_day
    db.commit()
