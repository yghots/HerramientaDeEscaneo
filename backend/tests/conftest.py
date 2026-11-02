import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.app.db.database import Base, get_db
from backend.app.db.models import District, Category, Source, Business, WebsiteStatus, CommercialStatus
from backend.app.main import app

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    SessionTest = sessionmaker(bind=connection)
    session = SessionTest()

    # Seed minimal test data
    d = District(
        name="Jesús María",
        min_lat=-12.086,
        max_lat=-12.065,
        min_lon=-77.058,
        max_lon=-77.039
    )
    c = Category(
        slug="restaurantes-cafeterias",
        name="Restaurantes y cafeterías",
        osm_tags={"amenity": ["restaurant", "cafe"]}
    )
    s = Source(
        slug="osm_file",
        name="OpenStreetMap Test",
        source_type="osm_file",
        attribution="ODbL"
    )
    session.add_all([d, c, s])
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
