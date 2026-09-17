from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def _encode(payload: dict, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {**payload, "exp": expire}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def _decode(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def create_access_token(user_id: int, token_version: int) -> str:
    payload = {"sub": str(user_id), "ver": token_version, "type": "access"}
    return _encode(payload, settings.access_token_expire_minutes)


def decode_access_token(token: str) -> dict | None:
    payload = _decode(token)
    if payload is None or payload.get("type") != "access":
        return None
    return payload


def create_purpose_token(user_id: int, purpose: str, expires_minutes: int) -> str:
    payload = {"sub": str(user_id), "type": purpose}
    return _encode(payload, expires_minutes)


def decode_purpose_token(token: str, expected_purpose: str) -> int | None:
    payload = _decode(token)
    if payload is None or payload.get("type") != expected_purpose:
        return None
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        return None
