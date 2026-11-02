from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.database import get_db
from backend.app.db.models import District, Business
from backend.app.schemas.district import DistrictResponse, DistrictCreate

router = APIRouter(prefix="/districts", tags=["Districts"])

@router.get("", response_model=list[DistrictResponse])
def list_districts(db: Session = Depends(get_db)):
    districts = db.query(District).filter(District.is_active == True).order_by(District.name.asc()).all()
    # Compute business counts per district
    counts = dict(
        db.query(Business.district_id, func.count(Business.id))
        .filter(Business.district_id.isnot(None))
        .group_by(Business.district_id)
        .all()
    )

    results = []
    for d in districts:
        d_resp = DistrictResponse.model_validate(d)
        d_resp.business_count = counts.get(d.id, 0)
        results.append(d_resp)
    return results

@router.post("", response_model=DistrictResponse)
def create_district(payload: DistrictCreate, db: Session = Depends(get_db)):
    existing = db.query(District).filter(District.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="El distrito ya existe")

    new_d = District(**payload.model_dump())
    db.add(new_d)
    db.commit()
    db.refresh(new_d)
    return new_d
