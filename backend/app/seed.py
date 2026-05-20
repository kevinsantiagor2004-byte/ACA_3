from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import Buyer, MarketPrice, NotificationChannel, Offer, OfferStatus, PreOrder, Producer


def seed_demo_data(db: Session) -> None:
    if db.query(Producer).first():
        return

    producers = [
        Producer(
            name="Martha Rojas",
            phone="3110000001",
            municipality="Fusagasuga",
            crop_type="Tomate",
            parcel_size_hectares=2.3,
            notification_channel=NotificationChannel.both,
        ),
        Producer(
            name="Jose Hernandez",
            phone="3110000002",
            municipality="Sibaté",
            crop_type="Papa",
            parcel_size_hectares=4.1,
            notification_channel=NotificationChannel.sms,
        ),
    ]
    db.add_all(producers)
    db.flush()

    buyers = [
        Buyer(company_name="Central Fresca SAS", contact_name="Laura Pinto", zone="Bogota Sur", expected_demand_kg=1800),
        Buyer(company_name="Mercado Andino", contact_name="Carlos Duran", zone="Soacha", expected_demand_kg=1200),
    ]
    db.add_all(buyers)
    db.flush()

    offers = [
        Offer(
            producer_id=producers[0].id,
            product_name="Tomate chonto",
            estimated_volume_kg=950,
            harvest_date=date.today() + timedelta(days=3),
            location="Vereda El Triunfo",
            status=OfferStatus.published,
        ),
        Offer(
            producer_id=producers[1].id,
            product_name="Papa sabanera",
            estimated_volume_kg=1400,
            harvest_date=date.today() + timedelta(days=5),
            location="Vereda Chacua",
            status=OfferStatus.published,
        ),
    ]
    db.add_all(offers)
    db.flush()

    prices = [
        MarketPrice(market_name="Corabastos", product_name="Tomate chonto", price_per_kg=3200, captured_on=date.today()),
        MarketPrice(market_name="Corabastos", product_name="Papa sabanera", price_per_kg=2100, captured_on=date.today()),
        MarketPrice(market_name="Plaza de Soacha", product_name="Tomate chonto", price_per_kg=3000, captured_on=date.today()),
    ]
    db.add_all(prices)
    db.flush()

    preorder = PreOrder(
        buyer_id=buyers[0].id,
        offer_id=offers[0].id,
        agreed_price_per_kg=3050,
        reserved_volume_kg=500,
        pickup_route="Fusagasuga -> Bodega Sumapaz -> Bogota Sur",
        traceability_code="ASO-2026-TOM-001",
    )
    db.add(preorder)
    db.commit()
