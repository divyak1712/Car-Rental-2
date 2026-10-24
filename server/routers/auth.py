import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from auth import clear_session, create_session, get_optional_user, hash_password, verify_password
from database import engine

router = APIRouter()


class SignUpBody(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class SignInBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(body: SignUpBody, response: Response):
    user_id = str(uuid.uuid4())
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO users (id, email, password_hash, name) VALUES (:id, :email, :password_hash, :name)"
                ),
                {"id": user_id, "email": body.email, "password_hash": hash_password(body.password), "name": body.name},
            )
    except IntegrityError:
        raise HTTPException(409, "An account with that email already exists")
    create_session(response, user_id)
    return {"id": user_id, "email": body.email, "name": body.name, "isAdmin": False}


@router.post("/signin")
def signin(body: SignInBody, response: Response):
    with engine.begin() as conn:
        row = conn.execute(text("SELECT * FROM users WHERE email = :email"), {"email": body.email}).mappings().first()
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    create_session(response, row["id"])
    return {"id": row["id"], "email": row["email"], "name": row["name"], "isAdmin": bool(row["is_admin"])}


@router.post("/signout")
def signout(request: Request, response: Response):
    clear_session(request, response)
    return {"ok": True}


@router.get("/session")
def session(user: dict | None = Depends(get_optional_user)):
    if not user:
        return None
    return {"id": user["id"], "email": user["email"], "name": user["name"], "isAdmin": user["is_admin"]}
