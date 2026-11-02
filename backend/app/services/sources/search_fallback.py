from abc import ABC, abstractmethod
from typing import Optional
from urllib.parse import quote_plus
import httpx
from bs4 import BeautifulSoup
from backend.app.config import settings
from backend.app.services.normalizer import extract_domain, is_social_domain, is_directory_domain

class BaseSearchConnector(ABC):
    @property
    @abstractmethod
    def connector_name(self) -> str:
        pass

    @abstractmethod
    async def find_website(self, business_name: str, district: str) -> Optional[str]:
        pass


class OpenWebSearchConnector(BaseSearchConnector):
    """
    Polite search connector using DuckDuckGo HTML Lite interface.
    Designed for single targeted lookups without paid APIs or aggressive scraping.
    """
    @property
    def connector_name(self) -> str:
        return "DuckDuckGo Lite (Acceso Web Público)"

    async def find_website(self, business_name: str, district: str) -> Optional[str]:
        query = f'"{business_name}" "{district}" Lima Peru'
        url = f"https://lite.duckduckgo.com/lite/?q={quote_plus(query)}"
        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    return None

                soup = BeautifulSoup(resp.text, "lxml")
                # Look for result links
                links = soup.find_all("a", class_="result-link")
                for link in links:
                    href = link.get("href")
                    if href:
                        domain = extract_domain(href)
                        if domain and not is_social_domain(domain) and not is_directory_domain(domain):
                            return href
                return None
        except Exception:
            # Safe degradation if search fails or is throttled
            return None
