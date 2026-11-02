import csv
import io
from typing import List
from backend.app.db.models import Business

def export_businesses_to_csv(businesses: List[Business]) -> io.StringIO:
    """
    Generates an Excel-compatible CSV stream with UTF-8 BOM.
    """
    output = io.StringIO()
    # Write UTF-8 BOM for Microsoft Excel compatibility
    output.write("\ufeff")

    fieldnames = [
        "ID Nexo",
        "Nombre Comercial",
        "Categoría",
        "Distrito",
        "Dirección",
        "Teléfono",
        "Correo Electrónico",
        "Estado Web",
        "Sitio Web Declarado",
        "Redes Sociales",
        "Estado Comercial",
        "No Contactar",
        "Notas",
        "Enlace Origen (OSM)",
        "Fecha Verificación"
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()

    for b in businesses:
        socials_str = ", ".join(f"{k}: {v}" for k, v in (b.social_profiles or {}).items())
        writer.writerow({
            "ID Nexo": b.internal_id,
            "Nombre Comercial": b.name,
            "Categoría": b.category_name or "Comercio local",
            "Distrito": b.district_name or "",
            "Dirección": b.address or "",
            "Teléfono": b.phone or "",
            "Correo Electrónico": b.email or "",
            "Estado Web": b.website_status.value if hasattr(b.website_status, "value") else str(b.website_status),
            "Sitio Web Declarado": b.website_declared or "",
            "Redes Sociales": socials_str,
            "Estado Comercial": b.commercial_status.value if hasattr(b.commercial_status, "value") else str(b.commercial_status),
            "No Contactar": "Sí" if b.do_not_contact else "No",
            "Notas": b.notes or "",
            "Enlace Origen (OSM)": b.origin_url or "",
            "Fecha Verificación": b.last_verified_at.strftime("%Y-%m-%d %H:%M") if b.last_verified_at else ""
        })

    output.seek(0)
    return output
