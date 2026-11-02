from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.db.models import ScanStatus

class ScanCreateRequest(BaseModel):
    district_id: int
    category_slugs: Optional[List[str]] = None
    source_name: str = "osm_overpass"  # or 'osm_file'
    grid_size_km: float = 1.0

class ScanCellResponse(BaseModel):
    id: int
    cell_index: int
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    status: ScanStatus
    items_found: int
    error_message: Optional[str] = None
    executed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ScanJobResponse(BaseModel):
    id: int
    district_id: Optional[int] = None
    district_name: str
    categories_selected: List[str]
    source_name: str
    grid_size_km: float
    total_cells: int
    completed_cells: int
    found_count: int
    new_count: int
    status: ScanStatus
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    cells: List[ScanCellResponse] = []

    model_config = ConfigDict(from_attributes=True)
