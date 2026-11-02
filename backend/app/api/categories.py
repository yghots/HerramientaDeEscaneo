from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.database import get_db
from backend.app.db.models import Category, Business
from backend.app.schemas.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.is_active == True).order_by(Category.name.asc()).all()
    # Compute business counts per category
    counts = dict(
        db.query(Business.category_id, func.count(Business.id))
        .filter(Business.category_id.isnot(None))
        .group_by(Business.category_id)
        .all()
    )

    results = []
    for c in categories:
        c_resp = CategoryResponse.model_validate(c)
        c_resp.business_count = counts.get(c.id, 0)
        results.append(c_resp)
    return results

@router.post("", response_model=CategoryResponse)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="La categoría ya existe")

    new_cat = Category(**payload.model_dump())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
