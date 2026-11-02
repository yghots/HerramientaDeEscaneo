import pytest
from backend.app.services.geo_grid import generate_grid_cells
from backend.app.db.models import ScanJob, ScanCell, ScanStatus, Business
from backend.app.services.scan_runner import run_scan_job

def test_generate_grid_cells():
    cells = generate_grid_cells(
        min_lat=-12.086,
        max_lat=-12.065,
        min_lon=-77.058,
        max_lon=-77.039,
        grid_size_km=1.0
    )
    assert len(cells) >= 4
    for c in cells:
        assert "cell_index" in c
        assert c["min_lat"] < c["max_lat"]
        assert c["min_lon"] < c["max_lon"]

@pytest.mark.asyncio
async def test_run_scan_job_lifecycle(db_session):
    # Setup job
    job = ScanJob(
        district_name="Jesús María",
        source_name="osm_file",
        grid_size_km=1.0,
        total_cells=1,
        completed_cells=0,
        status=ScanStatus.PENDING
    )
    db_session.add(job)
    db_session.commit()

    # Add single cell covering our sample data in Jesús María
    cell = ScanCell(
        scan_job_id=job.id,
        cell_index=0,
        min_lat=-12.09,
        max_lat=-12.06,
        min_lon=-77.06,
        max_lon=-77.03,
        status=ScanStatus.PENDING
    )
    db_session.add(cell)
    db_session.commit()

    # Run job
    await run_scan_job(job.id, db=db_session)

    db_session.refresh(job)
    assert job.status == ScanStatus.COMPLETED
    assert job.completed_cells == 1
    assert job.found_count > 0

    # Verify businesses were inserted
    biz_count = db_session.query(Business).filter(Business.district_name == "Jesús María").count()
    assert biz_count > 0
