import pytest
from backend.app.services.sources.osm_file import OSMFileConnector
from backend.app.services.sources.osm_helper import match_osm_category, extract_osm_properties

def test_match_osm_category():
    categories = [
        {"slug": "restaurantes-cafeterias", "name": "Restaurantes", "osm_tags": {"amenity": ["restaurant", "cafe"]}},
        {"slug": "barberias-peluquerias", "name": "Barberías", "osm_tags": {"shop": ["hairdresser", "barber"]}}
    ]

    slug, name = match_osm_category({"amenity": "restaurant"}, categories)
    assert slug == "restaurantes-cafeterias"

    slug, name = match_osm_category({"shop": "barber"}, categories)
    assert slug == "barberias-peluquerias"

    slug, name = match_osm_category({"amenity": "bank"}, categories)
    assert slug == "otros-comercios"

def test_extract_osm_properties():
    categories = [
        {"slug": "restaurantes-cafeterias", "name": "Restaurantes", "osm_tags": {"amenity": ["restaurant"]}}
    ]
    tags = {
        "name": "Chifa San Joy Lao",
        "amenity": "restaurant",
        "addr:street": "Jr. Huanta",
        "addr:housenumber": "780",
        "addr:district": "Lima Cercado",
        "phone": "+51 1 426-7799",
        "website": "https://sanjoylao.pe",
        "contact:facebook": "https://facebook.com/sanjoylao"
    }

    item = extract_osm_properties(
        origin_id="node/123456",
        tags=tags,
        lat=-12.05,
        lon=-77.03,
        categories=categories
    )

    assert item is not None
    assert item.name == "Chifa San Joy Lao"
    assert item.category_slug == "restaurantes-cafeterias"
    assert item.address == "Jr. Huanta 780"
    assert item.phone_raw == "+51 1 426-7799"
    assert item.website_raw == "https://sanjoylao.pe"
    assert item.social_profiles.get("facebook") == "https://facebook.com/sanjoylao"

@pytest.mark.asyncio
async def test_osm_file_connector_fetches_sample():
    connector = OSMFileConnector()
    # Query covering Jesús María bounds
    results = await connector.fetch_area(
        min_lat=-12.09,
        max_lat=-12.06,
        min_lon=-77.06,
        max_lon=-77.03,
        categories=[]
    )
    assert len(results) > 0
    names = [r.name for r in results]
    assert any("Cevichería" in n or "Barbería" in n for n in names)
