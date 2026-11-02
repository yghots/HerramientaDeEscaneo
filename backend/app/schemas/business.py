from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from backend.app.db.models import WebsiteStatus, CommercialStatus

class WebCheckResponse(BaseModel):
    id: int
    target_url: str
    final_url: Optional[str] = None
    http_status: Optional[int] = None
    is_accessible: bool
    ssl_valid: bool
    response_time_ms: Optional[float] = None
    page_title: Optional[str] = None
    page_description: Optional[str] = None
    matches_business_name: bool
    matches_phone: bool
    is_social_profile: bool
    is_directory_or_marketplace: bool
    error_details: Optional[str] = None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BusinessBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    address: Optional[str] = None
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    phone_raw: Optional[str] = None
    email: Optional[str] = None
    website_declared: Optional[str] = None
    website_domain: Optional[str] = None
    social_profiles: Dict[str, Any] = {}
    website_status: WebsiteStatus = WebsiteStatus.PENDIENTE_VERIFICACION
    commercial_status: CommercialStatus = CommercialStatus.NUEVO
    do_not_contact: bool = False
    notes: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: int
    internal_id: str
    source_id: Optional[int] = None
    origin_id: Optional[str] = None
    origin_url: Optional[str] = None
    website_status_reason: Optional[str] = None
    first_detected_at: datetime
    last_verified_at: datetime
    created_at: datetime
    updated_at: datetime
    web_checks: List[WebCheckResponse] = []

    model_config = ConfigDict(from_attributes=True)

class BusinessUpdateStatus(BaseModel):
    commercial_status: Optional[CommercialStatus] = None
    do_not_contact: Optional[bool] = None
    notes: Optional[str] = None

class BusinessFilterParams(BaseModel):
    district: Optional[str] = None
    category: Optional[str] = None
    website_status: Optional[str] = None
    commercial_status: Optional[str] = None
    has_phone: Optional[bool] = None
    has_email: Optional[bool] = None
    query: Optional[str] = None
    exclude_do_not_contact: bool = True
    page: int = 1
    page_size: int = 25

class BusinessListResponse(BaseModel):
    items: List[BusinessResponse]
    total: int
    page: int
    page_size: int
    pages: int
