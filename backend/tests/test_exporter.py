from datetime import datetime
from backend.app.db.models import Business, WebsiteStatus, CommercialStatus
from backend.app.services.exporter import export_businesses_to_csv

def test_export_businesses_to_csv():
    biz = Business(
        internal_id="NEXO-000099",
        name="Pollería La Granja Real",
        category_name="Restaurantes y cafeterías",
        district_name="Miraflores",
        address="Av. Larco 550",
        phone="+51 988 123 456",
        email="ventas@lagranjareal.pe",
        website_declared="https://lagranjareal.pe",
        social_profiles={"facebook": "https://fb.com/lagranjareal"},
        website_status=WebsiteStatus.WEB_PROPIA_DETECTADA,
        commercial_status=CommercialStatus.INTERESADO,
        do_not_contact=False,
        notes="Llamar el jueves",
        origin_url="https://www.openstreetmap.org/node/99",
        last_verified_at=datetime(2026, 11, 1, 10, 0)
    )

    csv_stream = export_businesses_to_csv([biz])
    content = csv_stream.getvalue()

    # Starts with UTF-8 BOM
    assert content.startswith("\ufeff")
    assert "Pollería La Granja Real" in content
    assert "NEXO-000099" in content
    assert "+51 988 123 456" in content
    assert "Miraflores" in content
    assert "WEB PROPIA DETECTADA" in content
    assert "Interesado" in content
