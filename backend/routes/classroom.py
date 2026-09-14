import logging
import secrets
import string
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Classroom, ClassroomMembership, StockPrice, Transaction, TransactionType, User, Wallet

logger = logging.getLogger(__name__)
router = APIRouter()


class ClassroomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ClassroomJoin(BaseModel):
    code: str = Field(min_length=4, max_length=10)


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


def generate_classroom_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def mask_email(email: str) -> str:
    if "@" not in email:
        return "***"
    local, _, domain = email.partition("@")
    if "." in domain:
        first, _, _rest = domain.partition(".")
        domain_masked = f"{first[:1]}***" if first else "***"
    else:
        domain_masked = "***"
    visible = local[:2] + "***" if len(local) > 2 else "***"
    return f"{visible}@{domain_masked}"


@router.post("/classrooms", response_model=ClassroomResponse)
async def create_classroom(data: ClassroomCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre de la clase no puede estar vacío")

    for _ in range(10):
        code = generate_classroom_code()
        if not db.query(Classroom).filter(Classroom.code == code).first():
            break
    else:
        raise HTTPException(status_code=500, detail="No se pudo generar un código único")

    nueva = Classroom(name=name, code=code, creator_id=user.id)
    db.add(nueva)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo crear la clase")
    db.refresh(nueva)

    db.add(ClassroomMembership(user_id=user.id, classroom_id=nueva.id, is_teacher=True))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()

    count = db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == nueva.id).count()
    return {"id": nueva.id, "name": nueva.name, "code": nueva.code, "creator_id": nueva.creator_id, "member_count": count}


@router.post("/classrooms/join")
async def join_classroom(data: ClassroomJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = data.code.strip().upper()
    clase = db.query(Classroom).filter(Classroom.code == code).first()
    if not clase:
        raise HTTPException(status_code=404, detail="No encontramos esa clase. Revisa el código.")

    exists = (
        db.query(ClassroomMembership)
        .filter(ClassroomMembership.user_id == user.id, ClassroomMembership.classroom_id == clase.id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="¡Ya eres miembro de esta clase!")

    db.add(ClassroomMembership(user_id=user.id, classroom_id=clase.id, is_teacher=False))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="¡Ya eres miembro de esta clase!")
    return {"message": f"¡Te has unido a la clase {clase.name}!"}


@router.get("/classrooms/my", response_model=List[ClassroomResponse])
async def get_my_classrooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(ClassroomMembership).filter(ClassroomMembership.user_id == user.id).all()
    if not memberships:
        return []
    classroom_ids = [m.classroom_id for m in memberships]
    clases = {c.id: c for c in db.query(Classroom).filter(Classroom.id.in_(classroom_ids)).all()}
    result = []
    for m in memberships:
        clase = clases.get(m.classroom_id)
        if not clase:
            continue
        count = db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == clase.id).count()
        result.append({"id": clase.id, "name": clase.name, "code": clase.code, "creator_id": clase.creator_id, "member_count": count})
    return result


@router.get("/classrooms/{classroom_id}/leaderboard", response_model=List[MemberPerformance])
async def get_classroom_leaderboard(classroom_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = (
        db.query(ClassroomMembership)
        .filter(ClassroomMembership.user_id == user.id, ClassroomMembership.classroom_id == classroom_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="No puedes ver esta clasificación porque no eres miembro de la clase")

    miembros = db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).all()
    member_ids = [m.user_id for m in miembros]
    users = {u.id: u for u in db.query(User).filter(User.id.in_(member_ids)).all()} if member_ids else {}
    wallets = {w.user_id: w for w in db.query(Wallet).filter(Wallet.user_id.in_(member_ids)).all()} if member_ids else {}

    txs = db.query(Transaction).filter(Transaction.user_id.in_(member_ids)).all() if member_ids else []
    net: dict[int, dict[int, int]] = {}
    for t in txs:
        user_map = net.setdefault(t.user_id, {})
        delta = t.quantity if t.type == TransactionType.buy else -t.quantity
        user_map[t.company_id] = user_map.get(t.company_id, 0) + delta

    company_ids = sorted({cid for m in net.values() for cid, q in m.items() if q > 0})
    prices: dict[int, float] = {}
    if company_ids:
        rows = (
            db.query(StockPrice)
            .filter(StockPrice.company_id.in_(company_ids))
            .order_by(StockPrice.company_id, desc(StockPrice.timestamp))
            .all()
        )
        for r in rows:
            prices.setdefault(r.company_id, float(r.price))

    board = []
    for m in miembros:
        u = users.get(m.user_id)
        w = wallets.get(m.user_id)
        if not u or not w:
            continue
        cash = float(w.balance)
        stocks_value = sum(q * prices.get(cid, 0.0) for cid, q in net.get(m.user_id, {}).items() if q > 0)
        total = cash + stocks_value
        pct = ((total - 50000) / 50000) * 100
        board.append(
            {
                "user_id": u.id,
                "email": mask_email(u.email),
                "initial_investment": 50000,
                "current_value": round(total, 2),
                "profit_percentage": round(pct, 2),
            }
        )
    board.sort(key=lambda x: x["profit_percentage"], reverse=True)
    return board
