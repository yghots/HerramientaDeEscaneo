from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import Business, ScanJob, ScanStatus

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    biz_count = db.query(Business).count()
    active_scans = db.query(ScanJob).filter(ScanJob.status == ScanStatus.RUNNING).count()
    return {
        "status": "ok",
        "service": "NEXO LEADS API",
        "version": "1.0.0",
        "database": "connected",
        "total_businesses": biz_count,
        "active_scans": active_scans
    }
