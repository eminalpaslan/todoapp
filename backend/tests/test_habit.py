import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _auth_headers() -> dict:
    email = f"habit_{uuid.uuid4().hex}@example.com"
    client.post("/auth/register", json={"email": email, "password": "sifre123"})
    login = client.post("/auth/login", json={"email": email, "password": "sifre123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_habit():
    headers = _auth_headers()

    create_response = client.post(
        "/habits", json={"name": "Spor yap", "period": "daily"}, headers=headers
    )
    assert create_response.status_code == 201
    assert create_response.json()["period"] == "daily"

    list_response = client.get("/habits", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_habit_period_defaults_to_daily():
    headers = _auth_headers()

    habit = client.post("/habits", json={"name": "Kitap oku"}, headers=headers).json()

    assert habit["period"] == "daily"


def test_delete_habit():
    headers = _auth_headers()
    habit = client.post("/habits", json={"name": "Silinecek"}, headers=headers).json()

    delete_response = client.delete(f"/habits/{habit['id']}", headers=headers)
    assert delete_response.status_code == 204

    list_response = client.get("/habits", headers=headers)
    assert list_response.json() == []


def test_user_cannot_access_other_users_habit():
    headers_a = _auth_headers()
    headers_b = _auth_headers()
    habit = client.post("/habits", json={"name": "Gizli"}, headers=headers_a).json()

    response = client.delete(f"/habits/{habit['id']}", headers=headers_b)

    assert response.status_code == 404


def test_habits_require_authentication():
    response = client.get("/habits")

    assert response.status_code == 401


def test_checkin_create_and_list():
    headers = _auth_headers()
    habit = client.post("/habits", json={"name": "Su iç"}, headers=headers).json()

    checkin_response = client.post(
        f"/habits/{habit['id']}/checkins", json={"period_key": "2026-10-01"}, headers=headers
    )
    assert checkin_response.status_code == 201
    assert checkin_response.json()["period_key"] == "2026-10-01"

    list_response = client.get(f"/habits/{habit['id']}/checkins", headers=headers)
    assert len(list_response.json()) == 1


def test_checkin_same_period_twice_is_idempotent():
    headers = _auth_headers()
    habit = client.post("/habits", json={"name": "Meditasyon"}, headers=headers).json()

    client.post(f"/habits/{habit['id']}/checkins", json={"period_key": "2026-W40"}, headers=headers)
    second_response = client.post(
        f"/habits/{habit['id']}/checkins", json={"period_key": "2026-W40"}, headers=headers
    )

    assert second_response.status_code == 201
    list_response = client.get(f"/habits/{habit['id']}/checkins", headers=headers)
    assert len(list_response.json()) == 1


def test_checkin_delete_unmarks_period():
    headers = _auth_headers()
    habit = client.post("/habits", json={"name": "Erken kalk"}, headers=headers).json()
    client.post(f"/habits/{habit['id']}/checkins", json={"period_key": "2026-10-01"}, headers=headers)

    delete_response = client.delete(
        f"/habits/{habit['id']}/checkins/2026-10-01", headers=headers
    )
    assert delete_response.status_code == 204

    list_response = client.get(f"/habits/{habit['id']}/checkins", headers=headers)
    assert list_response.json() == []


def test_checkin_delete_missing_period_returns_404():
    headers = _auth_headers()
    habit = client.post("/habits", json={"name": "Yoga"}, headers=headers).json()

    response = client.delete(f"/habits/{habit['id']}/checkins/2026-01-01", headers=headers)

    assert response.status_code == 404


def test_user_cannot_checkin_other_users_habit():
    headers_a = _auth_headers()
    headers_b = _auth_headers()
    habit = client.post("/habits", json={"name": "Gizli alışkanlık"}, headers=headers_a).json()

    response = client.post(
        f"/habits/{habit['id']}/checkins", json={"period_key": "2026-10-01"}, headers=headers_b
    )

    assert response.status_code == 404
