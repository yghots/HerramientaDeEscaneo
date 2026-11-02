import pytest
from backend.app.services.web_detector import is_safe_url, classify_business_from_source, check_website
from backend.app.db.models import WebsiteStatus

def test_ssrf_protection():
    # Loopback
    safe, msg = is_safe_url("http://127.0.0.1:8000/api")
    assert safe is False

    safe, msg = is_safe_url("http://localhost:3000")
    assert safe is False

    # AWS/Cloud Metadata
    safe, msg = is_safe_url("http://169.254.169.254/latest/meta-data/")
    assert safe is False

    # Private IP
    safe, msg = is_safe_url("http://192.168.1.50/dashboard")
    assert safe is False

    # Forbidden Scheme
    safe, msg = is_safe_url("file:///etc/passwd")
    assert safe is False

    safe, msg = is_safe_url("gopher://127.0.0.1:70")
    assert safe is False

def test_classify_from_source():
    # No web, no social
    status, reason = classify_business_from_source(None, {})
    assert status == WebsiteStatus.SIN_WEB_DETECTADA

    # Only social
    status, reason = classify_business_from_source(None, {"facebook": "https://fb.com/test"})
    assert status == WebsiteStatus.SOLO_REDES_SOCIALES

    # Website field contains facebook
    status, reason = classify_business_from_source("https://facebook.com/chifa", {})
    assert status == WebsiteStatus.SOLO_REDES_SOCIALES

    # Website field contains directory
    status, reason = classify_business_from_source("https://www.pedidosya.com.pe/rest/12", {})
    assert status == WebsiteStatus.REVISION_MANUAL

    # Custom domain declared -> pending verification
    status, reason = classify_business_from_source("https://mipolleria.pe", {})
    assert status == WebsiteStatus.PENDIENTE_VERIFICACION

@pytest.mark.asyncio
async def test_check_website_social_url():
    res = await check_website("https://instagram.com/cafeteria", "Cafetería Aroma")
    assert res.is_social_profile is True
    assert res.classification == WebsiteStatus.SOLO_REDES_SOCIALES

@pytest.mark.asyncio
async def test_check_website_ssrf_blocked():
    res = await check_website("http://127.0.0.1:9090", "Test Local")
    assert res.is_accessible is False
    assert res.classification == WebsiteStatus.WEB_CON_PROBLEMAS
    assert "bloqueado por seguridad" in res.classification_reason
