from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import NotificationChannel, OfferStatus, OrderStatus


class ProducerCreate(BaseModel):
    name: str
    phone: str
    municipality: str
    crop_type: str
    parcel_size_hectares: float = Field(gt=0)
    notification_channel: NotificationChannel


class ProducerRead(ProducerCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class BuyerCreate(BaseModel):
    company_name: str
    contact_name: str
    zone: str
    expected_demand_kg: float = Field(gt=0)


class BuyerRead(BuyerCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OfferCreate(BaseModel):
    producer_id: int
    product_name: str
    estimated_volume_kg: float = Field(gt=0)
    harvest_date: date
    location: str
    status: OfferStatus = OfferStatus.published


class OfferRead(OfferCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MarketPriceRead(BaseModel):
    id: int
    market_name: str
    product_name: str
    price_per_kg: float
    captured_on: date
    model_config = ConfigDict(from_attributes=True)


class PreOrderCreate(BaseModel):
    buyer_id: int
    offer_id: int
    agreed_price_per_kg: float = Field(gt=0)
    reserved_volume_kg: float = Field(gt=0)
    pickup_route: str


class PreOrderRead(BaseModel):
    id: int
    buyer_id: int
    offer_id: int
    agreed_price_per_kg: float
    reserved_volume_kg: float
    pickup_route: str
    traceability_code: str
    status: OrderStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_producers: int
    active_offers: int
    total_preorders: int
    avg_reference_price: float
    estimated_direct_revenue_cop: float
    adoption_rate: float


class TraceabilityReport(BaseModel):
    traceability_code: str
    producer_name: str
    product_name: str
    harvest_date: date
    buyer_company: str
    pickup_route: str
    status: OrderStatus
