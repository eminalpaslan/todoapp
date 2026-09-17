import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _auth_headers() -> dict:
    email = f"todo_{uuid.uuid4().hex}@example.com"
    client.post("/auth/register", json={"email": email, "password": "sifre123"})
    login = client.post("/auth/login", json={"email": email, "password": "sifre123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_todo():
    headers = _auth_headers()

    create_response = client.post(
        "/todos", json={"title": "Sut al", "description": "2 litre"}, headers=headers
    )
    assert create_response.status_code == 201
    assert create_response.json()["is_done"] is False

    list_response = client.get("/todos", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_update_todo_partial():
    headers = _auth_headers()
    todo = client.post("/todos", json={"title": "Ekmek al"}, headers=headers).json()

    response = client.patch(f"/todos/{todo['id']}", json={"is_done": True}, headers=headers)

    assert response.status_code == 200
    assert response.json()["is_done"] is True
    assert response.json()["title"] == "Ekmek al"


def test_delete_todo():
    headers = _auth_headers()
    todo = client.post("/todos", json={"title": "Silinecek"}, headers=headers).json()

    delete_response = client.delete(f"/todos/{todo['id']}", headers=headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/todos/{todo['id']}", headers=headers)
    assert get_response.status_code == 404


def test_user_cannot_access_other_users_todo():
    headers_a = _auth_headers()
    headers_b = _auth_headers()
    todo = client.post("/todos", json={"title": "Gizli"}, headers=headers_a).json()

    response = client.get(f"/todos/{todo['id']}", headers=headers_b)

    assert response.status_code == 404


def test_todos_require_authentication():
    response = client.get("/todos")

    assert response.status_code == 401
