from backend.app.services.normalizer import (
    normalize_peru_phone,
    normalize_email,
    normalize_url,
    extract_domain,
    is_social_domain,
    is_directory_domain
)

def test_normalize_peru_mobile():
    display, key = normalize_peru_phone("998 765 432")
    assert display == "+51 998 765 432"
    assert key == "51998765432"

    display, key = normalize_peru_phone("+51 987-123-456")
    assert display == "+51 987 123 456"
    assert key == "51987123456"

    display, key = normalize_peru_phone("0998765432")
    assert display == "+51 998 765 432"

def test_normalize_peru_landline():
    display, key = normalize_peru_phone("463-2211")
    assert display == "(01) 463-2211"
    assert key == "5114632211"

    display, key = normalize_peru_phone("+51 1 463 8890")
    assert display == "(01) 463-8890"
    assert key == "5114638890"

    display, key = normalize_peru_phone("01 4719988")
    assert display == "(01) 471-9988"
    assert key == "5114719988"

def test_normalize_invalid_phone():
    display, key = normalize_peru_phone("abc")
    assert display is None
    assert key is None

    display, key = normalize_peru_phone(None)
    assert display is None
    assert key is None

def test_normalize_email():
    assert normalize_email(" Contacto@NexoWeb.pe ") == "contacto@nexoweb.pe"
    assert normalize_email("invalid-email") is None
    assert normalize_email(None) is None

def test_normalize_url():
    assert normalize_url("www.misfavoritos.pe/") == "https://misfavoritos.pe"
    assert normalize_url("http://example.com/menu/?utm_source=fb") == "http://example.com/menu"
    assert normalize_url("https://WWW.POLLERIA.PE") == "https://polleria.pe"

def test_extract_domain():
    assert extract_domain("https://www.restaurante.pe/nosotros") == "restaurante.pe"
    assert extract_domain("misfavoritos.com:8080") == "misfavoritos.com"
    assert extract_domain(None) is None

def test_social_and_directory_detection():
    assert is_social_domain("https://www.facebook.com/barberia") is True
    assert is_social_domain("https://instagram.com/pizzeriaperu") is True
    assert is_social_domain("https://tiktok.com/@cevicheria") is True
    assert is_social_domain("https://mitiendapropia.pe") is False

    assert is_directory_domain("https://www.pedidosya.com.pe/restaurantes") is True
    assert is_directory_domain("https://www.paginasamarillas.com.pe/negocio") is True
    assert is_directory_domain("https://mitiendapropia.pe") is False
