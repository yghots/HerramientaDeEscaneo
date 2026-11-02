import asyncio
import hashlib
import json
import logging
from pathlib import Path
from typing import Callable
import httpx

from backend.app.config import settings
from backend.app.services.sources.base import BaseSourceConnector, RawBusinessItem
from backend.app.services.sources.osm_helper import extract_osm_properties

logger = logging.getLogger(__name__)

CACHE_DIR = settings.DATA_DIR / "cache" / "overpass"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class OSMOverpassConnector(BaseSourceConnector):
    """
    Connects to the OpenStreetMap Overpass API with rate-limiting, polite delays,
    local file caching, and fallback endpoints.
    """
    def __init__(self):
        self.endpoint = settings.OVERPASS_URL
        self.fallback_endpoints = settings.OVERPASS_FALLBACK_URLS

    @property
    def source_slug(self) -> str:
        return "osm_overpass"

    @property
    def source_name(self) -> str:
        return "OpenStreetMap (Overpass API en vivo)"

    @property
    def attribution(self) -> str:
        return "© Colaboradores de OpenStreetMap (Licencia ODbL)"

    def _build_overpass_query(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        categories: list[dict]
    ) -> str:
        # Collect distinct OSM keys to query
        osm_keys = set()
        for cat in categories:
            for k in cat.get("osm_tags", {}).keys():
                osm_keys.add(k)

        if not osm_keys:
            osm_keys = {"amenity", "shop", "leisure", "craft", "tourism", "office"}

        # Overpass bbox format is: (south, west, north, east) -> (min_lat, min_lon, max_lat, max_lon)
        bbox = f"({min_lat},{min_lon},{max_lat},{max_lon})"
        clauses = []
        for key in osm_keys:
            clauses.append(f'node["{key}"]{bbox};')
            clauses.append(f'way["{key}"]{bbox};')

        query_body = "\n  ".join(clauses)
        query = f"""[out:json][timeout:{settings.OVERPASS_TIMEOUT_SECONDS}];
(
  {query_body}
);
out center;"""
        return query

    def _get_cache_key(self, query: str) -> Path:
        h = hashlib.sha256(query.encode("utf-8")).hexdigest()
        return CACHE_DIR / f"overpass_{h}.json"

    async def fetch_area(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        categories: list[dict],
        progress_callback: Callable[[int, int, str], None] | None = None
    ) -> list[RawBusinessItem]:
        query = self._build_overpass_query(min_lat, max_lat, min_lon, max_lon, categories)
        cache_file = self._get_cache_key(query)

        # 1. Check local cache first (avoids repeated requests)
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return self._parse_overpass_elements(data.get("elements", []), categories)
            except Exception as e:
                logger.warning(f"Error reading Overpass cache: {e}")

        # 2. Query endpoints with polite delay & fallback
        headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "application/json"
        }

        endpoints_to_try = [self.endpoint] + self.fallback_endpoints
        last_error = None

        for endpoint in endpoints_to_try:
            try:
                if progress_callback:
                    progress_callback(0, 100, f"Consultando {endpoint}...")

                # Respect rate limit with polite pause
                await asyncio.sleep(settings.REQUEST_DELAY_SECONDS)

                async with httpx.AsyncClient(timeout=settings.OVERPASS_TIMEOUT_SECONDS) as client:
                    resp = await client.post(endpoint, data={"data": query}, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        # Cache response
                        try:
                            with open(cache_file, "w", encoding="utf-8") as f:
                                json.dump(data, f)
                        except Exception:
                            pass

                        return self._parse_overpass_elements(data.get("elements", []), categories)
                    elif resp.status_code in (429, 504, 502, 503):
                        last_error = f"Endpoint {endpoint} respondió con HTTP {resp.status_code}"
                        await asyncio.sleep(2.0)
                        continue
                    else:
                        last_error = f"HTTP {resp.status_code}: {resp.text[:100]}"
            except Exception as e:
                last_error = str(e)
                continue

        logger.error(f"Todos los endpoints de Overpass fallaron: {last_error}")
        raise RuntimeError(f"No se pudo consultar Overpass API: {last_error}")

    def _parse_overpass_elements(self, elements: list[dict], categories: list[dict]) -> list[RawBusinessItem]:
        results = []
        for el in elements:
            el_type = el.get("type", "node")
            el_id = el.get("id")
            tags = el.get("tags", {})
            if not tags:
                continue

            lat = el.get("lat")
            lon = el.get("lon")
            if lat is None or lon is None:
                center = el.get("center", {})
                lat = center.get("lat")
                lon = center.get("lon")

            item = extract_osm_properties(
                origin_id=f"{el_type}/{el_id}",
                tags=tags,
                lat=lat,
                lon=lon,
                categories=categories
            )
            if item:
                results.append(item)

        return results
