from typing import Optional, Dict, List, Any
from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    slug: str
    name: str
    icon: str = "Store"
    osm_tags: Dict[str, Any]
    description: Optional[str] = None
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    business_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
