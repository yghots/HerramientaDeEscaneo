from typing import Optional
from pydantic import BaseModel, ConfigDict

class DistrictBase(BaseModel):
    name: str
    province: str = "Lima"
    department: str = "Lima"
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    polygon_geojson: Optional[str] = None
    is_active: bool = True

class DistrictCreate(DistrictBase):
    pass

class DistrictResponse(DistrictBase):
    id: int
    business_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
