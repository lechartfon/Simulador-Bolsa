"""Seed local sintético e idempotente. No usar datos reales."""
import logging
import random
from datetime import datetime, timedelta
from decimal import Decimal

from passlib.hash import bcrypt
from sqlalchemy.orm import Session

from config import INITIAL_BALANCE
from database import SessionLocal
from models import Classroom, ClassroomMembership, Company, News, StockPrice, Transaction, TransactionType, User, Wallet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED = 20260516
PRICE_DAYS = 180
BASE_DATE = datetime(2026, 1, 1, 12, 0, 0)

COMPANIES = [
    ("ANA", "Acciona"),
    ("ANE", "Acciona Energía"),
    ("ACX", "Acerinox"),
    ("ACS", "ACS"),
    ("AENA", "Aena"),
    ("AMS", "Amadeus"),
    ("MTS", "ArcelorMittal"),
    ("SAB", "Banco Sabadell"),
    ("SAN", "Banco Santander"),
    ("BKT", "Bankinter"),
    ("BBVA", "BBVA"),
    ("CABK", "CaixaBank"),
    ("CLNX", "Cellnex"),
    ("COL", "Colonial"),
    ("ENG", "Enagás"),
    ("ELE", "Endesa"),
    ("FER", "Ferrovial"),
    ("FDR", "Fluidra"),
    ("GRF", "Grifols"),
    ("IAG", "IAG"),
    ("IBE", "Iberdrola"),
    ("IDR", "Indra"),
    ("ITX", "Inditex"),
    ("LOG", "Logista"),
    ("MAP", "Mapfre"),
    ("MEL", "Meliá Hotels"),
    ("MRL", "Merlin Properties"),
    ("NTGY", "Naturgy"),
    ("REDE", "Redeia"),
    ("REP", "Repsol"),
    ("ROVI", "Rovi"),
    ("SAC", "Sacyr"),
    ("SLR", "Solaria"),
    ("TEL", "Telefónica"),
    ("UNI", "Unicaja Banco"),
]

DEMO_USERS = [
    ("admin@local.test", "DemoAdmin123!", "admin"),
    ("demo@local.test", "DemoTrader123!", "user"),
    ("student1@local.test", "DemoTrader123!", "user"),
]


def get_or_create_user(db: Session, email: str, password: str, role: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.role != role:
            user.role = role
            db.commit()
        return user
    user = User(email=email, hashed_password=bcrypt.hash(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=Decimal(str(INITIAL_BALANCE)))
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def seed_companies_and_prices(db: Session) -> dict[str, Company]:
    result = {}
    for idx, (symbol, name) in enumerate(COMPANIES):
        company = db.query(Company).filter(Company.symbol == symbol).first()
        if not company:
            company = Company(symbol=symbol, name=name)
            db.add(company)
            db.commit()
            db.refresh(company)
        result[symbol] = company

        existing = db.query(StockPrice).filter(StockPrice.company_id == company.id).count()
        if existing >= PRICE_DAYS:
            continue

        rng = random.Random(SEED + idx)
        base = rng.uniform(40, 180)
        price = base
        for day in range(PRICE_DAYS):
            change = (rng.random() - 0.5) * 0.04
            price = max(5.0, price * (1 + change))
            ts = BASE_DATE + timedelta(days=day)
            if not db.query(StockPrice).filter(StockPrice.company_id == company.id, StockPrice.timestamp == ts).first():
                db.add(StockPrice(company_id=company.id, timestamp=ts, price=Decimal(f"{price:.2f}")))
        db.commit()
    return result


def seed_demo_activity(db: Session, companies: dict[str, Company]) -> None:
    users = {}
    for email, password, role in DEMO_USERS:
        user = get_or_create_user(db, email, password, role)
        get_or_create_wallet(db, user.id)
        users[email] = user

    admin = users["admin@local.test"]
    demo = users["demo@local.test"]
    student = users["student1@local.test"]

    classroom = db.query(Classroom).filter(Classroom.code == "DEMO01").first()
    if not classroom:
        classroom = Classroom(name="Clase Demo", code="DEMO01", creator_id=admin.id)
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
    for u, teacher in ((admin, True), (demo, False), (student, False)):
        if not db.query(ClassroomMembership).filter(
            ClassroomMembership.user_id == u.id, ClassroomMembership.classroom_id == classroom.id
        ).first():
            db.add(ClassroomMembership(user_id=u.id, classroom_id=classroom.id, is_teacher=teacher))
    db.commit()

    if db.query(News).count() == 0:
        examples = [
            ("Cómo leer un gráfico de acciones", "Guía educativa local sobre velas, volumen y medias móviles.", "https://example.com/guia-graficos", None),
            ("Qué es la diversificación", "Ejemplo educativo: repartir compras entre empresas reduce riesgo.", "https://example.com/diversificacion", None),
            ("Cómo funciona esta demo", "Los precios son sintéticos y solo sirven para practicar en local.", "https://example.com/demo-local", None),
        ]
        for title, content, url, image in examples:
            db.add(News(title=title, content=content, url=url, image_url=image, created_by=admin.id))
        db.commit()

    if db.query(Transaction).count() == 0:
        acciona = companies["ANA"]
        iberdrola = companies["IBE"]
        for company, qty in ((acciona, 5), (iberdrola, 10)):
            latest = db.query(StockPrice).filter(StockPrice.company_id == company.id).order_by(StockPrice.timestamp.desc()).first()
            if not latest:
                continue
            db.add(Transaction(user_id=demo.id, company_id=company.id, type=TransactionType.buy, quantity=qty, price_per_share=latest.price, timestamp=BASE_DATE + timedelta(days=PRICE_DAYS)))
            wallet = get_or_create_wallet(db, demo.id)
            wallet.balance = Decimal(str(wallet.balance)) - (Decimal(str(latest.price)) * qty)
        db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        companies = seed_companies_and_prices(db)
        seed_demo_activity(db, companies)
        logger.info("Seed local completado")
    finally:
        db.close()


if __name__ == "__main__":
    main()
