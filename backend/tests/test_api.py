from backend.app.db.models import Business, WebsiteStatus, CommercialStatus

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "total_businesses" in data

def test_api_districts(client):
    res = client.get("/api/districts")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(d["name"] == "Jesús María" for d in data)

def test_api_categories(client):
    res = client.get("/api/categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(c["slug"] == "restaurantes-cafeterias" for c in data)

def test_api_businesses_crud_and_filter(client, db_session):
    # Insert test business
    b = Business(
        internal_id="NEXO-000555",
        name="Gimnasio Olimpo",
        category_name="Gimnasios y centros deportivos",
        district_name="Jesús María",
        phone="+51 911 222 333",
        website_status=WebsiteStatus.SIN_WEB_DETECTADA,
        commercial_status=CommercialStatus.NUEVO,
        do_not_contact=False
    )
    db_session.add(b)
    db_session.commit()

    # Query list
    res = client.get("/api/businesses?query=Olimpo")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["items"][0]["name"] == "Gimnasio Olimpo"

    # Patch status
    patch_res = client.patch(
        f"/api/businesses/{b.id}/status",
        json={"commercial_status": "Contactado", "notes": "Hablamos con Juan"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["commercial_status"] == "Contactado"
    assert patch_res.json()["notes"] == "Hablamos con Juan"

def test_api_export_csv(client, db_session):
    res = client.get("/api/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=" in res.headers["content-disposition"]
