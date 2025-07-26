# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.connection import get_db
from app.models.user import Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

def test_user_registration(client):
    response = client.post("/api/v1/auth/register", json={
        "age_range": "25-35",
        "topics": "anxiety, depression",
        "severity_level": "moderate",
        "preferred_times": ["morning", "evening"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "commitment" in data
    assert "access_token" in data

def test_session_creation(client):
    # First register a user
    register_response = client.post("/api/v1/auth/register", json={
        "age_range": "25-35",
        "topics": "anxiety",
        "severity_level": "mild",
        "preferred_times": ["evening"]
    })
    token = register_response.json()["access_token"]
    
    # Create session
    response = client.post(
        "/api/v1/sessions/create",
        json={"topic": "anxiety support", "max_participants": 4},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_hash" in data
    assert data["topic"] == "anxiety support"
