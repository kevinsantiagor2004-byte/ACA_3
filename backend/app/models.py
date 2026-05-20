from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class NotificationChannel(str, Enum):
    sms = "SMS"
    push = "PUSH"
    both = "BOTH"


class OfferStatus(str, Enum):
    draft = "DRAFT"
    published = "PUBLISHED"
    reserved = "RESERVED"


class OrderStatus(str, Enum):
    pending = "PENDING"
    confirmed = "CONFIRMED"
    delivered = "DELIVERED"


class Producer(Base):
    __tablename__ = "producers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    municipality: Mapped[str] = mapped_column(String(80), nullable=False)
    crop_type: Mapped[str] = mapped_column(String(80), nullable=False)
    parcel_size_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    notification_channel: Mapped[NotificationChannel] = mapped_column(SqlEnum(NotificationChannel), default=NotificationChannel.both)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    offers: Mapped[list["Offer"]] = relationship(back_populates="producer", cascade="all, delete-orphan")


class Buyer(Base):
    __tablename__ = "buyers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_name: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(120), nullable=False)
    zone: Mapped[str] = mapped_column(String(80), nullable=False)
    expected_demand_kg: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    orders: Mapped[list["PreOrder"]] = relationship(back_populates="buyer")


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producers.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(80), nullable=False)
    estimated_volume_kg: Mapped[float] = mapped_column(Float, nullable=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[OfferStatus] = mapped_column(SqlEnum(OfferStatus), default=OfferStatus.published)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    producer: Mapped["Producer"] = relationship(back_populates="offers")
    orders: Mapped[list["PreOrder"]] = relationship(back_populates="offer")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    market_name: Mapped[str] = mapped_column(String(120), nullable=False)
    product_name: Mapped[str] = mapped_column(String(80), nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    captured_on: Mapped[date] = mapped_column(Date, nullable=False)


class PreOrder(Base):
    __tablename__ = "pre_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("buyers.id"), nullable=False)
    offer_id: Mapped[int] = mapped_column(ForeignKey("offers.id"), nullable=False)
    agreed_price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    reserved_volume_kg: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_route: Mapped[str] = mapped_column(String(200), nullable=False)
    traceability_code: Mapped[str] = mapped_column(String(60), nullable=False, unique=True, index=True)
    status: Mapped[OrderStatus] = mapped_column(SqlEnum(OrderStatus), default=OrderStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    buyer: Mapped["Buyer"] = relationship(back_populates="orders")
    offer: Mapped["Offer"] = relationship(back_populates="orders")
