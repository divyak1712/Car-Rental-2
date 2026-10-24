import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, Request, Response
from sqlalchemy import text

from database import engine

SESSION_COOKIE = "session"
SESSION_TTL_DAYS = 30


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO sessions (id, user_id, expires_at) VALUES (:id, :user_id, :expires_at)"),
            {"id": _hash_token(token), "user_id": user_id, "expires_at": expires_at},
        )
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("ENV") == "production",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
    )


def clear_session(request: Request, response: Response) -> None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM sessions WHERE id = :id"), {"id": _hash_token(token)})
    response.delete_cookie(SESSION_COOKIE)


def get_current_user(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(401, "Sign in required")
    with engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT u.id, u.email, u.name, u.is_admin FROM sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.id = :id AND s.expires_at > UTC_TIMESTAMP()
                """
            ),
            {"id": _hash_token(token)},
        ).mappings().first()
    if not row:
        raise HTTPException(401, "Sign in required")
    return {**dict(row), "is_admin": bool(row["is_admin"])}


def get_optional_user(request: Request) -> dict | None:
    try:
        return get_current_user(request)
    except HTTPException:
        return None


def require_admin(request: Request) -> dict:
    user = get_current_user(request)
    if not user["is_admin"]:
        raise HTTPException(403, "Admin access required")
    return user
