from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.db.database import get_db
from backend.app.db.models import Business
from backend.app.services.exporter import export_businesses_to_csv

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/csv")
def export_csv(
    district: Optional[str] = None,
    category: Optional[str] = None,
    website_status: Optional[str] = None,
    commercial_status: Optional[str] = None,
    has_phone: Optional[bool] = None,
    has_email: Optional[bool] = None,
    query: Optional[str] = None,
    exclude_do_not_contact: bool = True,
    db: Session = Depends(get_db)
):
    q = db.query(Business)

    if district:
        q = q.filter(Business.district_name == district)
    if category:
        q = q.filter(Business.category_name.ilike(f"%{category}%"))
    if website_status:
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

    businesses = q.order_by(Business.id.desc()).all()
    csv_io = export_businesses_to_csv(businesses)

    filename = "nexo_leads_prospectos.csv"
    if district:
        clean_dist = "".join(c for c in district if c.isalnum() or c in ("-", "_")).lower()
        filename = f"nexo_leads_{clean_dist}.csv"

    return Response(
        content=csv_io.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
