from typing import Any
from backend.app.services.sources.base import RawBusinessItem

def match_osm_category(tags: dict[str, Any], categories: list[dict]) -> tuple[str | None, str | None]:
    """
    Matches OSM tags to registered internal categories.
    Returns (category_slug, category_name) or (None, None).
    """
    for cat in categories:
        cat_osm_tags = cat.get("osm_tags", {})
        for key, expected_values in cat_osm_tags.items():
            actual_val = tags.get(key)
            if actual_val:
                if isinstance(expected_values, list) and actual_val in expected_values:
                    return cat.get("slug"), cat.get("name")
                elif actual_val == expected_values:
                    return cat.get("slug"), cat.get("name")

    # Generic fallback
    if tags.get("amenity"):
        return "otros-comercios", f"Servicio ({tags.get('amenity')})"
    if tags.get("shop"):
        return "otros-comercios", f"Comercio ({tags.get('shop')})"
    return "otros-comercios", "Comercio local"


def extract_osm_properties(
    origin_id: str,
    tags: dict[str, Any],
    lat: float | None,
    lon: float | None,
    categories: list[dict],
    default_district: str | None = None
) -> RawBusinessItem | None:
    """Extracts and normalizes raw properties from OSM node/way/relation tags."""
    # Must have a commercial or recognizable name
    name = (
        tags.get("name")
        or tags.get("name:es")
        or tags.get("brand")
        or tags.get("operator")
    )
    if not name or not name.strip():
        return None

    name = name.strip()

    # Address
    street = tags.get("addr:street", "")
    number = tags.get("addr:housenumber", "")
    full_address = f"{street} {number}".strip() if (street or number) else None

    # District
    district = tags.get("addr:district") or tags.get("addr:suburb") or tags.get("addr:city") or default_district

    # Category matching
    cat_slug, cat_name = match_osm_category(tags, categories)

    # Phone
    phone = (
        tags.get("phone")
        or tags.get("contact:phone")
        or tags.get("telephone")
        or tags.get("mobile")
        or tags.get("contact:mobile")
        or tags.get("contact:whatsapp")
    )

    # Email
    email = tags.get("email") or tags.get("contact:email")

    # Website
    website = tags.get("website") or tags.get("contact:website") or tags.get("url")

    # Socials
    socials = {}
    if tags.get("contact:facebook") or tags.get("facebook"):
        socials["facebook"] = tags.get("contact:facebook") or tags.get("facebook")
    if tags.get("contact:instagram") or tags.get("instagram"):
        socials["instagram"] = tags.get("contact:instagram") or tags.get("instagram")
    if tags.get("contact:tiktok") or tags.get("tiktok"):
        socials["tiktok"] = tags.get("contact:tiktok") or tags.get("tiktok")
    if tags.get("contact:youtube") or tags.get("youtube"):
        socials["youtube"] = tags.get("contact:youtube") or tags.get("youtube")

    # URL to OSM
    osm_type, raw_id = origin_id.split("/") if "/" in origin_id else ("node", origin_id)
    origin_url = f"https://www.openstreetmap.org/{osm_type}/{raw_id}"

    return RawBusinessItem(
        origin_id=f"osm:{origin_id}",
        origin_url=origin_url,
        name=name,
        category_slug=cat_slug,
        category_name=cat_name,
        address=full_address,
        district_name=district,
        latitude=lat,
        longitude=lon,
        phone_raw=str(phone).strip() if phone else None,
        email_raw=str(email).strip() if email else None,
        website_raw=str(website).strip() if website else None,
        social_profiles=socials,
        raw_tags=tags
    )
