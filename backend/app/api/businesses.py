from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from backend.app.db.database import get_db
from backend.app.db.models import Business, WebCheck, WebsiteStatus, CommercialStatus
from backend.app.schemas.business import (
    BusinessResponse, BusinessListResponse, BusinessUpdateStatus, WebCheckResponse
)
from backend.app.services.web_detector import check_website

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.get("/stats")
def get_business_stats(db: Session = Depends(get_db)):
    total = db.query(Business).count()
    sin_web = db.query(Business).filter(Business.website_status == WebsiteStatus.SIN_WEB_DETECTADA).count()
    solo_redes = db.query(Business).filter(Business.website_status == WebsiteStatus.SOLO_REDES_SOCIALES).count()
    web_propia = db.query(Business).filter(Business.website_status == WebsiteStatus.WEB_PROPIA_DETECTADA).count()
    web_problemas = db.query(Business).filter(Business.website_status == WebsiteStatus.WEB_CON_PROBLEMAS).count()
    con_telefono = db.query(Business).filter(Business.phone.isnot(None), Business.phone != "").count()
    con_correo = db.query(Business).filter(Business.email.isnot(None), Business.email != "").count()
    do_not_contact = db.query(Business).filter(Business.do_not_contact == True).count()

    return {
        "total": total,
        "sin_web": sin_web,
        "solo_redes": solo_redes,
        "web_propia": web_propia,
        "web_problemas": web_problemas,
        "con_telefono": con_telefono,
        "con_correo": con_correo,
        "do_not_contact": do_not_contact
    }

@router.get("", response_model=BusinessListResponse)
def list_businesses(
    district: Optional[str] = None,
    category: Optional[str] = None,
    website_status: Optional[str] = None,
    commercial_status: Optional[str] = None,
    has_phone: Optional[bool] = None,
    has_email: Optional[bool] = None,
    query: Optional[str] = None,
    exclude_do_not_contact: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(Business)

    if district:
        q = q.filter(Business.district_name == district)

    if category:
        q = q.filter(Business.category_name.ilike(f"%{category}%"))

    if website_status:
        # Support comma-separated statuses e.g. "SIN WEB DETECTADA,SOLO REDES SOCIALES"
        statuses = [s.strip() for s in website_status.split(",") if s.strip()]
        if statuses:
            q = q.filter(Business.website_status.in_(statuses))

    if commercial_status:
        q = q.filter(Business.commercial_status == commercial_status)

    if has_phone is True:
        q = q.filter(Business.phone.isnot(None), Business.phone != "")
    elif has_phone is False:
        q = q.filter(or_(Business.phone.is_(None), Business.phone == ""))

    if has_email is True:
        q = q.filter(Business.email.isnot(None), Business.email != "")
    elif has_email is False:
        q = q.filter(or_(Business.email.is_(None), Business.email == ""))

    if exclude_do_not_contact:
        q = q.filter(Business.do_not_contact == False)

    if query:
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Business.name.ilike(term),
                Business.address.ilike(term),
                Business.phone.ilike(term),
                Business.notes.ilike(term)
            )
        )

    total = q.count()
    items = q.order_by(Business.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    pages = ceil(total / page_size) if total > 0 else 1

    return BusinessListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )

@router.get("/{id}", response_model=BusinessResponse)
def get_business(id: int, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    return biz

@router.get("/{id}/website-checks", response_model=list[WebCheckResponse])
def get_website_checks(id: int, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    checks = db.query(WebCheck).filter(WebCheck.business_id == id).order_by(WebCheck.checked_at.desc()).all()
    return checks

@router.post("/{id}/verify-website", response_model=BusinessResponse)
async def verify_business_website(id: int, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    target_url = biz.website_declared
    if not target_url:
        biz.website_status = WebsiteStatus.SIN_WEB_DETECTADA
        biz.website_status_reason = "No hay URL registrada para verificar."
        db.commit()
        db.refresh(biz)
        return biz

    check_res = await check_website(
        target_url=target_url,
        business_name=biz.name,
        expected_phone=biz.phone
    )

    log_entry = WebCheck(
        business_id=biz.id,
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
    db.add(log_entry)

    biz.website_status = check_res.classification
    biz.website_status_reason = check_res.classification_reason
    db.commit()
    db.refresh(biz)
    return biz

@router.patch("/{id}/status", response_model=BusinessResponse)
def update_business_status(
    id: int,
    payload: BusinessUpdateStatus,
    db: Session = Depends(get_db)
):
    biz = db.query(Business).filter(Business.id == id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    if payload.commercial_status is not None:
        biz.commercial_status = payload.commercial_status
        if payload.commercial_status == CommercialStatus.NO_VOLVER_A_CONTACTAR:
            biz.do_not_contact = True

    if payload.do_not_contact is not None:
        biz.do_not_contact = payload.do_not_contact

    if payload.notes is not None:
        biz.notes = payload.notes

    db.commit()
    db.refresh(biz)
    return biz
