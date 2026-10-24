import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from auth import require_admin
from database import engine

router = APIRouter()


def to_resource(row: dict) -> dict:
    return {**row, "metadata": json.loads(row["metadata"])}


class CarBody(BaseModel):
    name: str
    category: str
    description: str
    image: str | None = None
    price: float
    metadata: dict = {}


@router.get("")
def list_resources():
    with engine.begin() as conn:
        rows = conn.execute(text("SELECT * FROM resources ORDER BY id")).mappings().all()
    return [to_resource(dict(r)) for r in rows]


@router.get("/{resource_id}")
def get_resource(resource_id: int):
    with engine.begin() as conn:
        row = conn.execute(text("SELECT * FROM resources WHERE id = :id"), {"id": resource_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Resource not found")
    return to_resource(dict(row))


@router.post("")
def create_car(body: CarBody, admin: dict = Depends(require_admin)):
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                INSERT INTO resources (name, category, description, image, price, capacity, metadata)
                VALUES (:name, :category, :description, :image, :price, 1, :metadata)
                """
            ),
            {**body.model_dump(), "metadata": json.dumps(body.metadata)},
        )
        new_id = result.lastrowid
        row = conn.execute(text("SELECT * FROM resources WHERE id = :id"), {"id": new_id}).mappings().first()
    return to_resource(dict(row))


@router.put("/{resource_id}")
def update_car(resource_id: int, body: CarBody, admin: dict = Depends(require_admin)):
    with engine.begin() as conn:
        existing = conn.execute(text("SELECT id FROM resources WHERE id = :id"), {"id": resource_id}).first()
        if not existing:
            raise HTTPException(404, "Resource not found")
        conn.execute(
            text(
                """
                UPDATE resources
                SET name = :name, category = :category, description = :description,
                    image = :image, price = :price, metadata = :metadata
                WHERE id = :id
                """
            ),
            {**body.model_dump(), "metadata": json.dumps(body.metadata), "id": resource_id},
        )
        row = conn.execute(text("SELECT * FROM resources WHERE id = :id"), {"id": resource_id}).mappings().first()
    return to_resource(dict(row))


@router.delete("/{resource_id}")
def delete_car(resource_id: int, admin: dict = Depends(require_admin)):
    with engine.begin() as conn:
        existing = conn.execute(text("SELECT id FROM resources WHERE id = :id"), {"id": resource_id}).first()
        if not existing:
            raise HTTPException(404, "Resource not found")
        conn.execute(text("DELETE FROM resources WHERE id = :id"), {"id": resource_id})
    return {"ok": True}
