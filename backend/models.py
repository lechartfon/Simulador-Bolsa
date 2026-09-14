from database import Base
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    DECIMAL,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func
import enum
from sqlalchemy import Enum
from sqlalchemy.orm import relationship

INITIAL_BALANCE_DEFAULT = 50000


class StockPrice(Base):
    __tablename__ = "stock_prices"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=func.now())
    price = Column(DECIMAL(12, 2), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    __table_args__ = (
        Index("ix_stock_prices_company_timestamp", "company_id", "timestamp"),
        CheckConstraint("price > 0", name="ck_stock_price_positive"),
    )


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    created_at = Column(DateTime, default=func.now())
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    memberships = relationship("ClassroomMembership", back_populates="user")
    news = relationship("News", back_populates="creator")

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="ck_user_role"),
    )

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=func.now())
    transactions = relationship("Transaction", back_populates="company")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    balance = Column(DECIMAL(12, 2), nullable=False, default=INITIAL_BALANCE_DEFAULT)
    user = relationship("User", back_populates="wallet")

    __table_args__ = (
        CheckConstraint("balance >= 0", name="ck_wallet_balance_non_negative"),
    )

class TransactionType(enum.Enum):
    buy = "buy"
    sell = "sell"

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_share = Column(DECIMAL(12, 2), nullable=False)
    timestamp = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="transactions")
    company = relationship("Company", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_transaction_quantity_positive"),
        CheckConstraint("price_per_share > 0", name="ck_transaction_price_positive"),
        Index("ix_transactions_user_company", "user_id", "company_id"),
    )

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    members = relationship("ClassroomMembership", back_populates="classroom")
    
class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    is_teacher = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="memberships")
    classroom = relationship("Classroom", back_populates="members")

    __table_args__ = (
        UniqueConstraint("user_id", "classroom_id", name="uq_membership_user_classroom"),
    )
    
class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(String(2000), nullable=False)
    url = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User", back_populates="news")