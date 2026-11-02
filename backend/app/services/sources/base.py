from abc import ABC, abstractmethod
from typing import Any, Callable
from pydantic import BaseModel

class RawBusinessItem(BaseModel):
    origin_id: str
    origin_url: str | None = None
    name: str
    category_slug: str | None = None
    category_name: str | None = None
    address: str | None = None
    district_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone_raw: str | None = None
    email_raw: str | None = None
    website_raw: str | None = None
    social_profiles: dict[str, str] = {}
    raw_tags: dict[str, Any] = {}

class BaseSourceConnector(ABC):
    @property
    @abstractmethod
    def source_slug(self) -> str:
        """Unique slug identifier for the source."""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable name of the source."""
        pass

    @property
    @abstractmethod
    def attribution(self) -> str:
        """Attribution text required by the source license."""
        pass

    @abstractmethod
    async def fetch_area(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        categories: list[dict],
        progress_callback: Callable[[int, int, str], None] | None = None
    ) -> list[RawBusinessItem]:
        """Fetches commercial entities within a bounding box."""
        pass
