from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, SessionLocal, engine, get_db
from .models import Buyer, MarketPrice, Offer, OfferStatus, PreOrder, Producer
from .schemas import (
    BuyerCreate,
    BuyerRead,
    DashboardSummary,
    MarketPriceRead,
    OfferCreate,
    OfferRead,
    PreOrderCreate,
    PreOrderRead,
    ProducerCreate,
    ProducerRead,
    TraceabilityReport,
)
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.get("/health")
def health():
    return {"status": "ok"}


@api.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)):
    total_producers = db.query(func.count(Producer.id)).scalar() or 0
    active_offers = db.query(func.count(Offer.id)).filter(Offer.status == OfferStatus.published).scalar() or 0
    total_preorders = db.query(func.count(PreOrder.id)).scalar() or 0
    avg_reference_price = db.query(func.avg(MarketPrice.price_per_kg)).scalar() or 0
    estimated_direct_revenue = db.query(func.sum(PreOrder.agreed_price_per_kg * PreOrder.reserved_volume_kg)).scalar() or 0
    adoption_rate = (total_producers / 150) * 100 if total_producers else 0

    return DashboardSummary(
        total_producers=total_producers,
        active_offers=active_offers,
        total_preorders=total_preorders,
        avg_reference_price=round(avg_reference_price, 2),
        estimated_direct_revenue_cop=round(estimated_direct_revenue, 2),
        adoption_rate=round(adoption_rate, 2),
    )


@api.get("/producers", response_model=list[ProducerRead])
def list_producers(db: Session = Depends(get_db)):
    return db.query(Producer).order_by(Producer.id.desc()).all()


@api.post("/producers", response_model=ProducerRead, status_code=201)
def create_producer(payload: ProducerCreate, db: Session = Depends(get_db)):
    producer = Producer(**payload.model_dump())
    db.add(producer)
    db.commit()
    db.refresh(producer)
    return producer


@api.get("/buyers", response_model=list[BuyerRead])
def list_buyers(db: Session = Depends(get_db)):
    return db.query(Buyer).order_by(Buyer.id.desc()).all()


@api.post("/buyers", response_model=BuyerRead, status_code=201)
def create_buyer(payload: BuyerCreate, db: Session = Depends(get_db)):
    buyer = Buyer(**payload.model_dump())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer


@api.get("/offers", response_model=list[OfferRead])
def list_offers(db: Session = Depends(get_db)):
    return db.query(Offer).order_by(Offer.harvest_date.asc()).all()


@api.post("/offers", response_model=OfferRead, status_code=201)
def create_offer(payload: OfferCreate, db: Session = Depends(get_db)):
    producer = db.get(Producer, payload.producer_id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producer not found")

    offer = Offer(**payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@api.get("/market-prices", response_model=list[MarketPriceRead])
def list_market_prices(db: Session = Depends(get_db)):
    return db.query(MarketPrice).order_by(MarketPrice.captured_on.desc(), MarketPrice.market_name.asc()).all()


@api.get("/preorders", response_model=list[PreOrderRead])
def list_preorders(db: Session = Depends(get_db)):
    return db.query(PreOrder).order_by(PreOrder.created_at.desc()).all()


@api.post("/preorders", response_model=PreOrderRead, status_code=201)
def create_preorder(payload: PreOrderCreate, db: Session = Depends(get_db)):
    buyer = db.get(Buyer, payload.buyer_id)
    offer = db.get(Offer, payload.offer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if payload.reserved_volume_kg > offer.estimated_volume_kg:
        raise HTTPException(status_code=400, detail="Reserved volume exceeds available offer")

    preorder = PreOrder(
        **payload.model_dump(),
        traceability_code=f"ASO-{uuid4().hex[:10].upper()}",
    )
    offer.status = OfferStatus.reserved
    db.add(preorder)
    db.commit()
    db.refresh(preorder)
    return preorder


@api.get("/traceability/{traceability_code}", response_model=TraceabilityReport)
def get_traceability(traceability_code: str, db: Session = Depends(get_db)):
    preorder = db.query(PreOrder).filter(PreOrder.traceability_code == traceability_code).first()
    if not preorder:
        raise HTTPException(status_code=404, detail="Traceability code not found")

    return TraceabilityReport(
        traceability_code=preorder.traceability_code,
        producer_name=preorder.offer.producer.name,
        product_name=preorder.offer.product_name,
        harvest_date=preorder.offer.harvest_date,
        buyer_company=preorder.buyer.company_name,
        pickup_route=preorder.pickup_route,
        status=preorder.status,
    )


app.include_router(api)
