import json
from pathlib import Path
from typing import Callable
from backend.app.config import settings
from backend.app.services.sources.base import BaseSourceConnector, RawBusinessItem
from backend.app.services.sources.osm_helper import extract_osm_properties

class OSMFileConnector(BaseSourceConnector):
    """
    Imports OSM data from local GeoJSON or JSON files (e.g. Lima extracts from BBBike or Geofabrik).
    100% offline, reproducible and fast.
    """
    def __init__(self, file_path: Path | str | None = None):
        if file_path:
            self.file_path = Path(file_path)
        else:
            self.file_path = settings.DATA_DIR / "sample_lima_osm.geojson"

    @property
    def source_slug(self) -> str:
        return "osm_file"

    @property
    def source_name(self) -> str:
        return "OpenStreetMap (Extracto de archivo local)"

    @property
    def attribution(self) -> str:
        return "Datos de OpenStreetMap bajo licencia ODbL (Open Data Commons Open Database License)"

    async def fetch_area(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        categories: list[dict],
        progress_callback: Callable[[int, int, str], None] | None = None
    ) -> list[RawBusinessItem]:
        results: list[RawBusinessItem] = []

        if not self.file_path.exists():
            return results

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        features = data.get("features", [])
        total = len(features)

        for idx, feat in enumerate(features):
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates")
            if not coords or len(coords) < 2:
                continue

            lon, lat = coords[0], coords[1]
            # Bounding box check
            if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
                continue

            tags = feat.get("properties", {})
            feat_id = feat.get("id") or f"node/{idx}"
            item = extract_osm_properties(
                origin_id=str(feat_id),
                tags=tags,
                lat=lat,
                lon=lon,
                categories=categories
            )
            if item:
                results.append(item)

            if progress_callback and idx % 20 == 0:
                progress_callback(idx + 1, total, f"Procesando elemento {idx + 1}/{total} de archivo...")

        return results
