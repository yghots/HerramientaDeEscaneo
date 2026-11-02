import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.db.models import ScanJob, ScanCell, ScanStatus, District
from backend.app.schemas.scan import ScanJobResponse, ScanCreateRequest
from backend.app.services.geo_grid import generate_grid_cells
from backend.app.services.scan_runner import run_scan_job, ACTIVE_SCAN_TASKS

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.get("", response_model=list[ScanJobResponse])
def list_scans(db: Session = Depends(get_db)):
    jobs = db.query(ScanJob).order_by(ScanJob.id.desc()).limit(50).all()
    return jobs

@router.post("", response_model=ScanJobResponse)
async def create_scan(payload: ScanCreateRequest, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == payload.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="Distrito no encontrado")

    # Generate grid cells for the district
    raw_cells = generate_grid_cells(
        min_lat=district.min_lat,
        max_lat=district.max_lat,
        min_lon=district.min_lon,
        max_lon=district.max_lon,
        grid_size_km=payload.grid_size_km
    )

    job = ScanJob(
        district_id=district.id,
        district_name=district.name,
        categories_selected=payload.category_slugs or [],
        source_name=payload.source_name,
        grid_size_km=payload.grid_size_km,
        total_cells=len(raw_cells),
        completed_cells=0,
        found_count=0,
        new_count=0,
        status=ScanStatus.PENDING
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Add cell entries
    for c in raw_cells:
        cell_entry = ScanCell(
            scan_job_id=job.id,
            cell_index=c["cell_index"],
            min_lat=c["min_lat"],
            max_lat=c["max_lat"],
            min_lon=c["min_lon"],
            max_lon=c["max_lon"],
            status=ScanStatus.PENDING
        )
        db.add(cell_entry)
    db.commit()
    db.refresh(job)

    # Launch background scan
    task = asyncio.create_task(run_scan_job(job.id))
    ACTIVE_SCAN_TASKS[job.id] = task

    return job

@router.get("/{id}", response_model=ScanJobResponse)
def get_scan(id: int, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo de exploración no encontrado")
    return job

@router.post("/{id}/pause", response_model=ScanJobResponse)
def pause_scan(id: int, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo de exploración no encontrado")

    if job.status == ScanStatus.RUNNING:
        job.status = ScanStatus.PAUSED
        db.commit()

    return job

@router.post("/{id}/resume", response_model=ScanJobResponse)
async def resume_scan(id: int, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo de exploración no encontrado")

    if job.status == ScanStatus.PAUSED:
        job.status = ScanStatus.RUNNING
        db.commit()
        # Resume background task
        task = asyncio.create_task(run_scan_job(job.id))
        ACTIVE_SCAN_TASKS[job.id] = task

    return job

@router.post("/{id}/cancel", response_model=ScanJobResponse)
def cancel_scan(id: int, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo de exploración no encontrado")

    job.status = ScanStatus.CANCELLED
    db.commit()

    if id in ACTIVE_SCAN_TASKS:
        ACTIVE_SCAN_TASKS[id].cancel()
        ACTIVE_SCAN_TASKS.pop(id, None)

    return job
