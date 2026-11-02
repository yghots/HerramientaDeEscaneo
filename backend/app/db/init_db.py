import json
from pathlib import Path
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.db.database import engine, SessionLocal, Base
from backend.app.db.models import District, Category, Source, Business, WebsiteStatus, CommercialStatus
from backend.app.services.normalizer import normalize_peru_phone, normalize_email, normalize_url, extract_domain
from backend.app.services.web_detector import classify_business_from_source

def init_database():
    """Initializes tables and seeds default districts and categories."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        data_dir = settings.DATA_DIR

        # 1. Seed Districts
        districts_file = data_dir / "districts_seed.json"
        if districts_file.exists():
            with open(districts_file, "r", encoding="utf-8") as f:
                districts_data = json.load(f)
            for d in districts_data:
                exists = db.query(District).filter(District.name == d["name"]).first()
                if not exists:
                    db.add(District(
                        name=d["name"],
                        province=d.get("province", "Lima"),
                        department=d.get("department", "Lima"),
                        min_lat=d["min_lat"],
                        max_lat=d["max_lat"],
                        min_lon=d["min_lon"],
                        max_lon=d["max_lon"],
                        polygon_geojson=d.get("polygon_geojson")
                    ))
            db.commit()

        # 2. Seed Categories
        categories_file = data_dir / "categories_seed.json"
        if categories_file.exists():
            with open(categories_file, "r", encoding="utf-8") as f:
                categories_data = json.load(f)
            for c in categories_data:
                exists = db.query(Category).filter(Category.slug == c["slug"]).first()
                if not exists:
                    db.add(Category(
                        slug=c["slug"],
                        name=c["name"],
                        icon=c.get("icon", "Store"),
                        osm_tags=c.get("osm_tags", {}),
                        description=c.get("description")
                    ))
            db.commit()

        # 3. Seed Sources
        sources_default = [
            {
                "slug": "osm_file",
                "name": "OpenStreetMap (Extracto local Lima)",
                "source_type": "osm_file",
                "attribution": "© Colaboradores de OpenStreetMap (Licencia ODbL)",
                "license": "ODbL"
            },
            {
                "slug": "osm_overpass",
                "name": "OpenStreetMap (Overpass API)",
                "source_type": "osm_overpass",
                "attribution": "© Colaboradores de OpenStreetMap (Licencia ODbL)",
                "license": "ODbL"
            }
        ]
        for s in sources_default:
            exists = db.query(Source).filter(Source.slug == s["slug"]).first()
            if not exists:
                db.add(Source(**s))
        db.commit()

        # 4. Bootstrap sample businesses if empty
        biz_count = db.query(Business).count()
        sample_file = data_dir / "sample_lima_osm.geojson"
        if biz_count == 0 and sample_file.exists():
            source_rec = db.query(Source).filter(Source.slug == "osm_file").first()
            categories = db.query(Category).all()
            cat_map = {c.slug: c for c in categories}

            with open(sample_file, "r", encoding="utf-8") as f:
                geo_data = json.load(f)

            for idx, feat in enumerate(geo_data.get("features", [])):
                props = feat.get("properties", {})
                coords = feat.get("geometry", {}).get("coordinates", [None, None])
                lon, lat = coords[0], coords[1]
                name = props.get("name")
                if not name:
                    continue

                phone_raw = props.get("phone") or props.get("contact:phone")
                phone_display, _ = normalize_peru_phone(phone_raw)
                email_raw = props.get("email")
                email_norm = normalize_email(email_raw)
                web_raw = props.get("website") or props.get("contact:website")
                web_norm = normalize_url(web_raw)
                domain = extract_domain(web_norm)

                socials = {}
                if props.get("contact:facebook"):
                    socials["facebook"] = props.get("contact:facebook")
                if props.get("contact:instagram"):
                    socials["instagram"] = props.get("contact:instagram")

                status, reason = classify_business_from_source(web_norm, socials)

                district_name = props.get("addr:district")
                dist_rec = db.query(District).filter(District.name == district_name).first() if district_name else None

                street = props.get("addr:street", "")
                num = props.get("addr:housenumber", "")
                address = f"{street} {num}".strip() if (street or num) else None

                b = Business(
                    internal_id=f"NEXO-{idx+1:06d}",
                    source_id=source_rec.id if source_rec else None,
                    origin_id=str(feat.get("id")),
                    origin_url=f"https://www.openstreetmap.org/{feat.get('id')}",
                    name=name,
                    category_name=props.get("amenity") or props.get("shop") or "Comercio",
                    address=address,
                    district_id=dist_rec.id if dist_rec else None,
                    district_name=district_name,
                    latitude=lat,
                    longitude=lon,
                    phone=phone_display,
                    phone_raw=phone_raw,
                    email=email_norm,
                    website_declared=web_norm,
                    website_domain=domain,
                    social_profiles=socials,
                    website_status=status,
                    website_status_reason=reason,
                    commercial_status=CommercialStatus.NUEVO,
                    raw_tags=props
                )
                db.add(b)
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    init_database()
    print("Database initialized and seeded successfully.")
