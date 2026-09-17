import uuid

from fastapi.testclient import TestClient

from app.core.security import create_purpose_token
from app.main import app

client = TestClient(app)


def _unique_email() -> str:
    return f"test_{uuid.uuid4().hex}@example.com"


def _register_and_login(password: str = "sifre123") -> tuple[str, str, int]:
    email = _unique_email()
    register_response = client.post(
        "/auth/register", json={"email": email, "password": password}
    )
    user_id = register_response.json()["id"]
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return email, token, user_id


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


def test_register_with_short_password_returns_422():
    response = client.post(
        "/auth/register", json={"email": _unique_email(), "password": "kisa"}
    )

    assert response.status_code == 422


def test_login_rate_limit_blocks_after_too_many_attempts():
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "sifre123"})

    for _ in range(5):
        response = client.post(
            "/auth/login", json={"email": email, "password": "sifre123"}
        )
        assert response.status_code == 200

    response = client.post("/auth/login", json={"email": email, "password": "sifre123"})

    assert response.status_code == 429


def test_login_sql_injection_payload_is_rejected_safely():
    response = client.post(
        "/auth/login",
        json={"email": "' OR '1'='1", "password": "' OR '1'='1"},
    )

    # EmailStr formati zaten gecersiz oldugu icin veritabanina hic ulasmadan
    # 422 doner - ilk savunma katmani burada devreye giriyor.
    assert response.status_code == 422


def test_new_user_is_unverified_but_can_still_login():
    email, token, _ = _register_and_login()

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["is_verified"] is False


def test_verify_email_with_valid_token_marks_user_verified():
    email, token, user_id = _register_and_login()
    verify_token = create_purpose_token(user_id, "email_verify", 60)

    response = client.post("/auth/verify-email", json={"token": verify_token})
    assert response.status_code == 200

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.json()["is_verified"] is True


def test_verify_email_with_invalid_token_returns_400():
    response = client.post("/auth/verify-email", json={"token": "gecersiz-token"})

    assert response.status_code == 400


def test_verify_email_token_cannot_be_used_as_access_token():
    _, _, user_id = _register_and_login()
    verify_token = create_purpose_token(user_id, "email_verify", 60)

    # purpose token'i "type" alani "access" olmadigi icin gecerli bir
    # Authorization token'i olarak kabul edilmemeli
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {verify_token}"})

    assert response.status_code == 401


def test_logout_invalidates_existing_token():
    _, token, _ = _register_and_login()

    logout_response = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_response.status_code == 200

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 401


def test_update_password_requires_correct_current_password():
    _, token, _ = _register_and_login()

    response = client.patch(
        "/auth/me",
        json={"current_password": "yanlis", "new_password": "yenisifre123"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_update_password_success_invalidates_old_token():
    email, token, _ = _register_and_login(password="eskisifre123")

    response = client.patch(
        "/auth/me",
        json={"current_password": "eskisifre123", "new_password": "yenisifre123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    old_token_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert old_token_response.status_code == 401

    new_login = client.post(
        "/auth/login", json={"email": email, "password": "yenisifre123"}
    )
    assert new_login.status_code == 200


def test_update_email_resets_verification_status():
    _, token, user_id = _register_and_login()
    verify_token = create_purpose_token(user_id, "email_verify", 60)
    client.post("/auth/verify-email", json={"token": verify_token})

    new_email = _unique_email()
    response = client.patch(
        "/auth/me",
        json={"email": new_email},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == new_email
    assert response.json()["is_verified"] is False


def test_forgot_password_returns_same_message_for_known_and_unknown_email():
    email, _, _ = _register_and_login()

    known_response = client.post("/auth/forgot-password", json={"email": email})
    unknown_response = client.post(
        "/auth/forgot-password", json={"email": _unique_email()}
    )

    assert known_response.status_code == 200
    assert unknown_response.status_code == 200
    assert known_response.json() == unknown_response.json()


def test_reset_password_with_valid_token_changes_password():
    email, _, user_id = _register_and_login(password="eskisifre123")
    reset_token = create_purpose_token(user_id, "password_reset", 30)

    response = client.post(
        "/auth/reset-password",
        json={"token": reset_token, "new_password": "yenisifre123"},
    )
    assert response.status_code == 200

    old_login = client.post(
        "/auth/login", json={"email": email, "password": "eskisifre123"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login", json={"email": email, "password": "yenisifre123"}
    )
    assert new_login.status_code == 200


def test_reset_password_with_invalid_token_returns_400():
    response = client.post(
        "/auth/reset-password",
        json={"token": "gecersiz-token", "new_password": "yenisifre123"},
    )

    assert response.status_code == 400
