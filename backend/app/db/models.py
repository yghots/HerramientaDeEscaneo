import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class WebsiteStatus(str, enum.Enum):
    SIN_WEB_DETECTADA = "SIN WEB DETECTADA"
    WEB_PROPIA_DETECTADA = "WEB PROPIA DETECTADA"
    WEB_CON_PROBLEMAS = "WEB CON PROBLEMAS"
    SOLO_REDES_SOCIALES = "SOLO REDES SOCIALES"
    PENDIENTE_VERIFICACION = "PENDIENTE DE VERIFICACION"
    REVISION_MANUAL = "REVISION MANUAL"


class CommercialStatus(str, enum.Enum):
    NUEVO = "Nuevo"
    PENDIENTE_CONTACTAR = "Pendiente de contactar"
    CONTACTADO = "Contactado"
    RESPONDIO = "Respondió"
    INTERESADO = "Interesado"
    VENTA_CERRADA = "Venta cerrada"
    NO_INTERESADO = "No interesado"
    NO_VOLVER_A_CONTACTAR = "No volver a contactar"


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ERROR = "error"


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    province = Column(String(100), default="Lima")
    department = Column(String(100), default="Lima")
    min_lat = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)
    polygon_geojson = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    businesses = relationship("Business", back_populates="district")
    scan_jobs = relationship("ScanJob", back_populates="district")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    icon = Column(String(50), default="Store")
    osm_tags = Column(JSON, nullable=False)  # e.g. {"amenity": ["restaurant", "cafe"]}
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    businesses = relationship("Business", back_populates="category")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False)  # osm_overpass, osm_file, manual
    attribution = Column(String(255), nullable=False)
    license = Column(String(100), default="ODbL")
    is_enabled = Column(Boolean, default=True)

    businesses = relationship("Business", back_populates="source")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    internal_id = Column(String(50), unique=True, nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    origin_id = Column(String(100), index=True, nullable=True)  # e.g., 'osm:node/123456'
    origin_url = Column(String(255), nullable=True)

    name = Column(String(200), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category_name = Column(String(100), nullable=True, index=True)
    
    address = Column(String(255), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    district_name = Column(String(100), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Contact data
    phone = Column(String(50), nullable=True, index=True)          # Normalized phone
    phone_raw = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True, index=True)
    
    # Web & Social
    website_declared = Column(String(255), nullable=True)
    website_domain = Column(String(255), nullable=True, index=True)
    social_profiles = Column(JSON, default=dict)  # {"facebook": "...", "instagram": "..."}

    # Classification
    website_status = Column(
        Enum(WebsiteStatus),
        default=WebsiteStatus.PENDIENTE_VERIFICACION,
        nullable=False,
        index=True
    )
    website_status_reason = Column(Text, nullable=True)

    # Commercial status
    commercial_status = Column(
        Enum(CommercialStatus),
        default=CommercialStatus.NUEVO,
        nullable=False,
        index=True
    )
    do_not_contact = Column(Boolean, default=False, index=True)
    notes = Column(Text, nullable=True)

    # Raw metadata & audit
    raw_tags = Column(JSON, default=dict)
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    district = relationship("District", back_populates="businesses")
    category = relationship("Category", back_populates="businesses")
    source = relationship("Source", back_populates="businesses")
    web_checks = relationship("WebCheck", back_populates="business", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_business_search", "district_name", "category_name", "website_status", "commercial_status"),
    )


class WebCheck(Base):
    __tablename__ = "web_checks"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    target_url = Column(String(500), nullable=False)
    final_url = Column(String(500), nullable=True)
    http_status = Column(Integer, nullable=True)
    is_accessible = Column(Boolean, default=False)
    ssl_valid = Column(Boolean, default=False)
    response_time_ms = Column(Float, nullable=True)
    page_title = Column(String(255), nullable=True)
    page_description = Column(Text, nullable=True)
    matches_business_name = Column(Boolean, default=False)
    matches_phone = Column(Boolean, default=False)
    is_social_profile = Column(Boolean, default=False)
    is_directory_or_marketplace = Column(Boolean, default=False)
    error_details = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="web_checks")


class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    district_name = Column(String(100), nullable=False)
    categories_selected = Column(JSON, default=list)  # list of slugs
    source_name = Column(String(50), default="osm_overpass")
    grid_size_km = Column(Float, default=1.0)
    total_cells = Column(Integer, default=0)
    completed_cells = Column(Integer, default=0)
    found_count = Column(Integer, default=0)
    new_count = Column(Integer, default=0)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING, index=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    district = relationship("District", back_populates="scan_jobs")
    cells = relationship("ScanCell", back_populates="scan_job", cascade="all, delete-orphan")


class ScanCell(Base):
    __tablename__ = "scan_cells"

    id = Column(Integer, primary_key=True, index=True)
    scan_job_id = Column(Integer, ForeignKey("scan_jobs.id"), nullable=False, index=True)
    cell_index = Column(Integer, nullable=False)
    min_lat = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    items_found = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, nullable=True)

    scan_job = relationship("ScanJob", back_populates="cells")
