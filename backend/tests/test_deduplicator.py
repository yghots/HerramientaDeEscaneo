from backend.app.db.models import Business, WebsiteStatus, CommercialStatus
from backend.app.services.deduplicator import find_duplicate_business, haversine_distance_meters, string_similarity

def test_string_similarity():
    assert string_similarity("Cevichería El Marino", "Cevichería El Marino") == 1.0
    assert string_similarity("Cevichería El Marino", "cevicheria el marino") == 1.0
    assert string_similarity("Pollería Don Tito", "Farmacia Inkafarma") < 0.3

def test_haversine_distance():
    # Two points ~111 meters apart in latitude (0.001 deg)
    dist = haversine_distance_meters(-12.070, -77.050, -12.071, -77.050)
    assert 100 < dist < 120

def test_deduplicator_by_origin_id(db_session):
    b = Business(
        internal_id="NEXO-000001",
        origin_id="osm:node/12345",
        name="Café La Tertulia",
        district_name="Jesús María",
        phone="+51 999 111 222",
        website_status=WebsiteStatus.SIN_WEB_DETECTADA,
        commercial_status=CommercialStatus.NUEVO
    )
    db_session.add(b)
    db_session.commit()

    # Search with same origin_id
    dup = find_duplicate_business(
        db=db_session,
        origin_id="osm:node/12345",
        name="Café La Tertulia",
        district_name="Jesús María",
        phone=None,
        website_declared=None,
        latitude=None,
        longitude=None
    )
    assert dup is not None
    assert dup.id == b.id

def test_deduplicator_by_phone(db_session):
    b = Business(
        internal_id="NEXO-000002",
        origin_id="osm:node/99999",
        name="Veterinaria Huellitas Felices",
        district_name="Jesús María",
        phone="+51 988 777 666",
        website_status=WebsiteStatus.SIN_WEB_DETECTADA,
        commercial_status=CommercialStatus.NUEVO
    )
    db_session.add(b)
    db_session.commit()

    # New item with different origin_id but same phone and similar name
    dup = find_duplicate_business(
        db=db_session,
        origin_id="osm:node/88888",
        name="Veterinaria Huellitas Felices JM",
        district_name="Jesús María",
        phone="+51 988 777 666",
        website_declared=None,
        latitude=None,
        longitude=None
    )
    assert dup is not None
    assert dup.id == b.id
