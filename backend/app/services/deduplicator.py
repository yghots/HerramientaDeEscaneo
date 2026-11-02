import math
import unicodedata
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from backend.app.db.models import Business
from backend.app.services.normalizer import extract_domain, is_social_domain, is_directory_domain

def strip_accents(s: str) -> str:
    """Removes accents/diacritics from a string."""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

def string_similarity(a: str | None, b: str | None) -> float:
    """Calculates text similarity ratio between 0.0 and 1.0 (case and accent insensitive)."""
    if not a or not b:
        return 0.0
    s_a = strip_accents(a.strip().lower())
    s_b = strip_accents(b.strip().lower())
    return SequenceMatcher(None, s_a, s_b).ratio()


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two geographic points in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_duplicate_business(
    db: Session,
    origin_id: str | None,
    name: str,
    district_name: str | None,
    phone: str | None,
    website_declared: str | None,
    latitude: float | None,
    longitude: float | None
) -> Business | None:
    """
    Checks if a business already exists in the database.
    Order of checks:
    1. Exact origin_id match (same OSM node/way)
    2. Exact normalized phone match with name similarity > 0.65
    3. Same proper domain (if not social/directory) with name similarity > 0.60
    4. Geographic proximity (< 35m) in same district with name similarity > 0.85
    """
    # 1. Exact origin_id
    if origin_id:
        existing = db.query(Business).filter(Business.origin_id == origin_id).first()
        if existing:
            return existing

    # 2. Match by normalized phone
    if phone:
        candidates = db.query(Business).filter(Business.phone == phone).all()
        for cand in candidates:
            sim = string_similarity(name, cand.name)
            if sim >= 0.65:
                return cand

    # 3. Match by proper domain
    if website_declared:
        domain = extract_domain(website_declared)
        if domain and not is_social_domain(domain) and not is_directory_domain(domain):
            candidates = db.query(Business).filter(Business.website_domain == domain).all()
            for cand in candidates:
                sim = string_similarity(name, cand.name)
                if sim >= 0.60:
                    return cand

    # 4. Proximity & district
    if latitude is not None and longitude is not None and district_name:
        # Bounding box filter first (~100m is ~0.001 deg)
        lat_delta = 0.0005
        lon_delta = 0.0005
        nearby = db.query(Business).filter(
            Business.district_name == district_name,
            Business.latitude.between(latitude - lat_delta, latitude + lat_delta),
            Business.longitude.between(longitude - lon_delta, longitude + lon_delta)
        ).all()

        for cand in nearby:
            if cand.latitude is not None and cand.longitude is not None:
                dist = haversine_distance_meters(latitude, longitude, cand.latitude, cand.longitude)
                if dist <= 35:
                    sim = string_similarity(name, cand.name)
                    if sim >= 0.85:
                        return cand

    return None
