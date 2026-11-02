import ipaddress
import socket
import time
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from backend.app.config import settings
from backend.app.db.models import WebsiteStatus
from backend.app.services.normalizer import (
    extract_domain,
    is_social_domain,
    is_directory_domain,
    normalize_peru_phone,
    normalize_email,
    clean_text
)

# SSRF Blocked IP networks
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def is_safe_url(url: str) -> tuple[bool, str]:
    """
    Validates URL safety against SSRF and unauthorized schemes.
    Blocks private IPs, localhost, AWS metadata, non-HTTP/HTTPS schemes.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False, f"Esquema no permitido: {parsed.scheme}"

        hostname = parsed.hostname
        if not hostname:
            return False, "Nombre de host vacío"

        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            return False, "Acceso a localhost/metadatos bloqueado por seguridad"

        # Resolve IP addresses
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        except socket.gaierror:
            # Let HTTP client handle domain resolution failure later
            return True, "OK"

        for item in addr_info:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            for net in BLOCKED_NETWORKS:
                if ip_obj in net:
                    return False, f"Dirección IP no pública o restringida detectada: {ip_str}"

        return True, "OK"
    except Exception as e:
        return False, f"Error validando URL: {str(e)}"


class WebVerificationResult:
    def __init__(self):
        self.target_url: str = ""
        self.final_url: str | None = None
        self.http_status: int | None = None
        self.is_accessible: bool = False
        self.ssl_valid: bool = False
        self.response_time_ms: float | None = None
        self.page_title: str | None = None
        self.page_description: str | None = None
        self.matches_business_name: bool = False
        self.matches_phone: bool = False
        self.is_social_profile: bool = False
        self.is_directory_or_marketplace: bool = False
        self.error_details: str | None = None
        self.extracted_emails: list[str] = []
        self.extracted_phones: list[str] = []
        self.classification: WebsiteStatus = WebsiteStatus.SIN_WEB_DETECTADA
        self.classification_reason: str = ""


async def check_website(
    target_url: str,
    business_name: str,
    expected_phone: str | None = None,
    timeout_sec: float | None = None
) -> WebVerificationResult:
    """
    Performs full technical verification of a website:
    - SSRF prevention check
    - HTTP GET with redirects
    - Response time & SSL check
    - Title & metadata parsing
    - Content keyword matching (business name, phone)
    - Distinguishes social media, directories, down websites, own websites
    """
    res = WebVerificationResult()
    res.target_url = target_url
    timeout = timeout_sec or settings.HTTP_VERIFY_TIMEOUT_SECONDS

    # 1. Check if social or directory first
    if is_social_domain(target_url):
        res.is_social_profile = True
        res.classification = WebsiteStatus.SOLO_REDES_SOCIALES
        res.classification_reason = "El enlace corresponde a una red social comercial."
        return res

    if is_directory_domain(target_url):
        res.is_directory_or_marketplace = True
        res.classification = WebsiteStatus.REVISION_MANUAL
        res.classification_reason = "El enlace corresponde a un directorio o marketplace comercial."
        return res

    # 2. SSRF Check
    safe, reason = is_safe_url(target_url)
    if not safe:
        res.error_details = reason
        res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
        res.classification_reason = f"Destino bloqueado por seguridad: {reason}"
        return res

    headers = {
        "User-Agent": settings.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8"
    }

    start_time = time.time()
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            verify=True
        ) as client:
            resp = await client.get(target_url, headers=headers)
            res.response_time_ms = round((time.time() - start_time) * 1000, 2)
            res.http_status = resp.status_code
            res.final_url = str(resp.url)
            res.ssl_valid = str(resp.url).startswith("https://")

            # Check for redirect to social domain
            if is_social_domain(res.final_url):
                res.is_social_profile = True
                res.classification = WebsiteStatus.SOLO_REDES_SOCIALES
                res.classification_reason = "Redirecciona a un perfil de red social."
                return res

            if 200 <= resp.status_code < 400:
                res.is_accessible = True
                # Parse page content
                content_type = resp.headers.get("content-type", "")
                if "text/html" in content_type or "xml" in content_type or not content_type:
                    soup = BeautifulSoup(resp.text[:300000], "lxml")
                    
                    # Page title
                    if soup.title and soup.title.string:
                        res.page_title = clean_text(soup.title.string)[:250]

                    # Meta description
                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    if meta_desc and meta_desc.get("content"):
                        res.page_description = clean_text(meta_desc.get("content"))[:500]

                    # Match business name in title or text
                    name_words = [w.lower() for w in clean_text(business_name).split() if len(w) > 3]
                    page_text = soup.get_text().lower()
                    if name_words and any(w in page_text for w in name_words):
                        res.matches_business_name = True

                    # Match phone if provided
                    if expected_phone:
                        clean_expected = "".join(filter(str.isdigit, expected_phone))
                        if len(clean_expected) >= 7 and clean_expected in "".join(filter(str.isdigit, page_text)):
                            res.matches_phone = True

                # Determine if page is active business website
                res.classification = WebsiteStatus.WEB_PROPIA_DETECTADA
                res.classification_reason = f"Sitio accesible (HTTP {resp.status_code})."
                if res.matches_business_name:
                    res.classification_reason += " Coincide con el nombre del negocio."
            else:
                res.is_accessible = False
                res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
                res.classification_reason = f"El servidor respondió con error HTTP {resp.status_code}."

    except httpx.ConnectTimeout:
        res.error_details = "Tiempo de conexión agotado (ConnectTimeout)."
        res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
        res.classification_reason = "Tiempo de conexión agotado al intentar contactar al servidor."
    except httpx.ReadTimeout:
        res.error_details = "Tiempo de lectura agotado (ReadTimeout)."
        res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
        res.classification_reason = "El servidor no respondió a tiempo."
    except httpx.ConnectError as e:
        res.error_details = f"Error de conexión o dominio inexistente: {str(e)}"
        res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
        res.classification_reason = "No se pudo establecer conexión (dominio no responde o DNS falló)."
    except Exception as e:
        res.error_details = f"Excepción en verificación: {str(e)}"
        res.classification = WebsiteStatus.WEB_CON_PROBLEMAS
        res.classification_reason = f"Problema técnico al verificar: {str(e)[:80]}"

    return res


def classify_business_from_source(
    website_raw: str | None,
    social_profiles: dict,
    has_custom_domain: bool = False
) -> tuple[WebsiteStatus, str]:
    """
    Initial stage 1 classification based solely on source metadata.
    """
    # 1. No website and no socials
    if not website_raw and not social_profiles:
        return WebsiteStatus.SIN_WEB_DETECTADA, "No se encontró sitio web declarado en la fuente."

    # 2. Only social networks detected
    if not website_raw and social_profiles:
        social_names = ", ".join(social_profiles.keys())
        return WebsiteStatus.SOLO_REDES_SOCIALES, f"Solo se detectaron perfiles sociales ({social_names})."

    # 3. If website_raw is a social profile
    if website_raw and is_social_domain(website_raw):
        return WebsiteStatus.SOLO_REDES_SOCIALES, "El enlace registrado corresponde a una red social."

    # 4. If website_raw is a directory/marketplace
    if website_raw and is_directory_domain(website_raw):
        return WebsiteStatus.REVISION_MANUAL, "El enlace registrado corresponde a un directorio o marketplace."

    # 5. Has a website declared, needs technical check
    return WebsiteStatus.PENDIENTE_VERIFICACION, "Sitio web registrado pendiente de comprobación técnica."
