import asyncio
import logging
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.db.database import SessionLocal
from backend.app.db.models import (
    ScanJob, ScanCell, ScanStatus, Business, District, Category,
    Source, WebCheck, WebsiteStatus, CommercialStatus
)
from backend.app.services.geo_grid import generate_grid_cells
from backend.app.services.normalizer import (
    normalize_peru_phone,
    normalize_email,
    normalize_url,
    extract_domain
)
from backend.app.services.deduplicator import find_duplicate_business
from backend.app.services.web_detector import (
    classify_business_from_source,
    check_website
)
from backend.app.services.sources.osm_file import OSMFileConnector
from backend.app.services.sources.osm_overpass import OSMOverpassConnector

logger = logging.getLogger(__name__)

# Active in-memory task registry for cancellation / pause signaling
ACTIVE_SCAN_TASKS: dict[int, asyncio.Task] = {}


def generate_internal_id(db: Session) -> str:
    """Generates sequential internal ID like NEXO-000123."""
    count = db.query(Business).count() + 1
    return f"NEXO-{count:06d}"


async def run_scan_job(job_id: int, db: Session | None = None):
    """
    Main background worker that executes a ScanJob cell-by-cell.
    Handles pause, resume, cancel and persists progress in SQLite.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
        if not job:
            return

        job.status = ScanStatus.RUNNING
        job.started_at = datetime.utcnow()
        db.commit()

        # Load categories
        categories = db.query(Category).all()
        categories_dict = [
            {"slug": c.slug, "name": c.name, "osm_tags": c.osm_tags}
            for c in categories
            if not job.categories_selected or c.slug in job.categories_selected
        ]

        # Select connector
        if job.source_name == "osm_file":
            connector = OSMFileConnector()
        else:
            connector = OSMOverpassConnector()

        # Find or create source record
        source_rec = db.query(Source).filter(Source.slug == connector.source_slug).first()
        if not source_rec:
            source_rec = Source(
                slug=connector.source_slug,
                name=connector.source_name,
                source_type=connector.source_slug,
                attribution=connector.attribution
            )
            db.add(source_rec)
            db.commit()
            db.refresh(source_rec)

        # Get pending cells
        cells = db.query(ScanCell).filter(
            ScanCell.scan_job_id == job_id,
            ScanCell.status == ScanStatus.PENDING
        ).order_by(ScanCell.cell_index.asc()).all()

        for cell in cells:
            # Check if job was paused or cancelled in DB
            db.refresh(job)
            if job.status == ScanStatus.PAUSED:
                logger.info(f"ScanJob {job_id} pausado por el usuario.")
                return
            if job.status == ScanStatus.CANCELLED:
                logger.info(f"ScanJob {job_id} cancelado por el usuario.")
                return

            cell.status = ScanStatus.RUNNING
            db.commit()

            try:
                raw_items = await connector.fetch_area(
                    min_lat=cell.min_lat,
                    max_lat=cell.max_lat,
                    min_lon=cell.min_lon,
                    max_lon=cell.max_lon,
                    categories=categories_dict
                )

                cell_items_found = 0
                cell_new_found = 0

                for item in raw_items:
                    phone_display, phone_key = normalize_peru_phone(item.phone_raw)
                    email_norm = normalize_email(item.email_raw)
                    website_norm = normalize_url(item.website_raw)
                    domain = extract_domain(website_norm)

                    # Deduplication check
                    existing = find_duplicate_business(
                        db=db,
                        origin_id=item.origin_id,
                        name=item.name,
                        district_name=job.district_name,
                        phone=phone_key or phone_display,
                        website_declared=website_norm,
                        latitude=item.latitude,
                        longitude=item.longitude
                    )

                    if existing:
                        # Update missing info if present
                        if not existing.phone and phone_display:
                            existing.phone = phone_display
                        if not existing.email and email_norm:
                            existing.email = email_norm
                        if not existing.website_declared and website_norm:
                            existing.website_declared = website_norm
                            existing.website_domain = domain
                        existing.last_verified_at = datetime.utcnow()
                        db.commit()
                        cell_items_found += 1
                        continue

                    # Create new business record
                    init_status, init_reason = classify_business_from_source(
                        website_raw=website_norm,
                        social_profiles=item.social_profiles
                    )

                    new_biz = Business(
                        internal_id=generate_internal_id(db),
                        source_id=source_rec.id,
                        origin_id=item.origin_id,
                        origin_url=item.origin_url,
                        name=item.name,
                        category_name=item.category_name,
                        address=item.address,
                        district_id=job.district_id,
                        district_name=job.district_name,
                        latitude=item.latitude,
                        longitude=item.longitude,
                        phone=phone_display,
                        phone_raw=item.phone_raw,
                        email=email_norm,
                        website_declared=website_norm,
                        website_domain=domain,
                        social_profiles=item.social_profiles,
                        website_status=init_status,
                        website_status_reason=init_reason,
                        commercial_status=CommercialStatus.NUEVO,
                        raw_tags=item.raw_tags,
                        first_detected_at=datetime.utcnow(),
                        last_verified_at=datetime.utcnow()
                    )
                    db.add(new_biz)
                    db.commit()
                    db.refresh(new_biz)

                    # Stage 3 Technical check if website declared
                    if website_norm and init_status == WebsiteStatus.PENDIENTE_VERIFICACION:
                        try:
                            check_res = await check_website(
                                target_url=website_norm,
                                business_name=new_biz.name,
                                expected_phone=new_biz.phone
                            )
                            # Save check log
                            w_log = WebCheck(
                                business_id=new_biz.id,
                                target_url=check_res.target_url,
                                final_url=check_res.final_url,
                                http_status=check_res.http_status,
                                is_accessible=check_res.is_accessible,
                                ssl_valid=check_res.ssl_valid,
                                response_time_ms=check_res.response_time_ms,
                                page_title=check_res.page_title,
                                page_description=check_res.page_description,
                                matches_business_name=check_res.matches_business_name,
                                matches_phone=check_res.matches_phone,
                                is_social_profile=check_res.is_social_profile,
                                is_directory_or_marketplace=check_res.is_directory_or_marketplace,
                                error_details=check_res.error_details
                            )
                            db.add(w_log)
                            new_biz.website_status = check_res.classification
                            new_biz.website_status_reason = check_res.classification_reason
                            db.commit()
                        except Exception as e:
                            logger.error(f"Error checking website for {new_biz.name}: {e}")

                    cell_items_found += 1
                    cell_new_found += 1

                cell.status = ScanStatus.COMPLETED
                cell.items_found = cell_items_found
                cell.executed_at = datetime.utcnow()

                job.completed_cells += 1
                job.found_count += cell_items_found
                job.new_count += cell_new_found
                db.commit()

            except Exception as cell_err:
                logger.error(f"Error procesando celda {cell.cell_index}: {cell_err}")
                cell.status = ScanStatus.ERROR
                cell.error_message = str(cell_err)
                db.commit()

            # Slight delay between cells to stay polite
            await asyncio.sleep(0.5)

        # Finished all cells
        db.refresh(job)
        if job.status == ScanStatus.RUNNING:
            job.status = ScanStatus.COMPLETED
            job.finished_at = datetime.utcnow()
            db.commit()

    except Exception as e:
        logger.error(f"Error fatal en ScanJob {job_id}: {e}")
        if job:
            job.status = ScanStatus.ERROR
            job.error_message = str(e)
            db.commit()
    finally:
        ACTIVE_SCAN_TASKS.pop(job_id, None)
        if close_db:
            db.close()
