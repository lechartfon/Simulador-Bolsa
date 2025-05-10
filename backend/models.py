from .database import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, DECIMAL
from sqlalchemy.sql import func
import enum 
from sqlalchemy import Enum
import datetime
from sqlalchemy.orm import relationship

class StockPrice(Base):
    __tablename__ = "stock_prices"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    price = Column(Float)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")

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
    balance = Column(DECIMAL(12, 2), default=50000)
    user = relationship("User", back_populates="wallet")

class TransactionType(enum.Enum):
    buy = "buy"
    sell = "sell"

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_share = Column(DECIMAL(12, 2), nullable=False)
    timestamp = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="transactions")
    company = relationship("Company", back_populates="transactions")