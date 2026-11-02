import re
from urllib.parse import urlparse, urlunparse

# Known social media and directory platforms
SOCIAL_DOMAINS = {
    "facebook.com", "m.facebook.com", "fb.me", "fb.com",
    "instagram.com", "instagr.am",
    "tiktok.com",
    "twitter.com", "x.com",
    "linkedin.com",
    "youtube.com", "youtu.be",
    "pinterest.com",
    "threads.net"
}

DIRECTORY_MARKETPLACE_DOMAINS = {
    "pedidosya.com", "pedidosya.com.pe",
    "rappi.com", "rappi.com.pe",
    "paginasamarillas.com.pe", "paginasamarillas.pe",
    "tripadvisor.com", "tripadvisor.com.pe",
    "foursquare.com",
    "google.com", "goo.gl", "maps.google.com",
    "waze.com",
    "mercadolibre.com.pe", "mercadolibre.com",
    "olx.com.pe",
    "yelp.com"
}


def normalize_peru_phone(raw_phone: str | None) -> tuple[str | None, str | None]:
    """
    Normalizes a Peruvian telephone number.
    Returns a tuple of (normalized_display, normalized_key).
    - normalized_display: e.g. "+51 998 765 432" or "(01) 463-2211"
    - normalized_key: standard digits for deduplication (e.g. "51998765432" or "5114632211")
    """
    if not raw_phone:
        return None, None

    # Take first phone if separated by ; or / or ,
    first_part = re.split(r"[/;,|\n]", str(raw_phone))[0].strip()
    
    # Remove all non-digit characters
    digits = re.sub(r"\D", "", first_part)
    if not digits:
        return None, None

    # Handle Peruvian country code 51
    if digits.startswith("51") and len(digits) > 9:
        digits = digits[2:]

    # Remove leading 0 if present (e.g. 01 for Lima or 099...)
    if digits.startswith("0") and len(digits) > 7:
        digits = digits[1:]

    # 1. Mobile number: 9 digits starting with 9
    if len(digits) == 9 and digits.startswith("9"):
        display = f"+51 {digits[0:3]} {digits[3:6]} {digits[6:9]}"
        key = f"51{digits}"
        return display, key

    # 2. Lima landline: 8 digits starting with 1 (prefix 1 + 7 digits)
    if len(digits) == 8 and digits.startswith("1"):
        local = digits[1:]
        display = f"(01) {local[0:3]}-{local[3:7]}"
        key = f"511{local}"
        return display, key

    # 3. Lima landline: 7 digits (standard local length)
    if len(digits) == 7:
        display = f"(01) {digits[0:3]}-{digits[3:7]}"
        key = f"511{digits}"
        return display, key

    # Fallback: if not standard format, return cleaned digits if reasonable length
    if 6 <= len(digits) <= 12:
        return f"+51 {digits}", f"51{digits}"

    return None, None


def normalize_email(raw_email: str | None) -> str | None:
    """Normalizes an email address, lowercasing and trimming."""
    if not raw_email:
        return None
    cleaned = raw_email.strip().lower()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if re.match(pattern, cleaned):
        return cleaned
    return None


def normalize_url(raw_url: str | None) -> str | None:
    """
    Normalizes a website URL.
    Ensures scheme, removes trailing slash and tracking query params.
    """
    if not raw_url:
        return None

    cleaned = raw_url.strip()
    if not cleaned:
        return None

    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned

    try:
        parsed = urlparse(cleaned)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]

        path = parsed.path.rstrip("/")
        normalized = urlunparse((
            parsed.scheme.lower(),
            netloc,
            path,
            "",
            "",
            ""
        ))
        return normalized
    except Exception:
        return raw_url.strip()


def extract_domain(raw_url: str | None) -> str | None:
    """Extracts the base domain from a URL without www."""
    if not raw_url:
        return None

    cleaned = raw_url.strip()
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned

    try:
        parsed = urlparse(cleaned)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        # Remove port if present
        if ":" in domain:
            domain = domain.split(":")[0]
        return domain if domain else None
    except Exception:
        return None


def is_social_domain(domain_or_url: str | None) -> bool:
    """Checks if the URL or domain belongs to a social media network."""
    domain = extract_domain(domain_or_url)
    if not domain:
        return False
    return any(domain == s or domain.endswith("." + s) for s in SOCIAL_DOMAINS)


def is_directory_domain(domain_or_url: str | None) -> bool:
    """Checks if the URL or domain belongs to a marketplace, directory or search engine."""
    domain = extract_domain(domain_or_url)
    if not domain:
        return False
    return any(domain == d or domain.endswith("." + d) for d in DIRECTORY_MARKETPLACE_DOMAINS)


def clean_text(text: str | None) -> str:
    """Cleans up spaces and trims string."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()
