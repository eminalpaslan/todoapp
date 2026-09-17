import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _unique_email() -> str:
    return f"test_{uuid.uuid4().hex}@example.com"


def test_register_returns_created_user_without_password():
    email = _unique_email()

    response = client.post("/auth/register", json={"email": email, "password": "sifre123"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == email
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_duplicate_email_returns_409():
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "sifre123"})

    response = client.post("/auth/register", json={"email": email, "password": "sifre123"})

    assert response.status_code == 409


def test_login_with_wrong_password_returns_401():
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "sifre123"})

    response = client.post("/auth/login", json={"email": email, "password": "yanlis"})

    assert response.status_code == 401


def test_login_then_access_protected_route():
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "sifre123"})

    login_response = client.post(
        "/auth/login", json={"email": email, "password": "sifre123"}
    )
    token = login_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_protected_route_without_token_returns_401():
    response = client.get("/auth/me")

    assert response.status_code == 401
