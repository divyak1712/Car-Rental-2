import json

from fastapi import APIRouter, Depends
from sqlalchemy import text

from auth import get_current_user
from database import engine

router = APIRouter()


@router.get("")
def list_my_bookings(user: dict = Depends(get_current_user)):
    with engine.begin() as conn:
        rows = conn.execute(
            text(
                """
                SELECT b.booking_ref, b.starts_at, b.ends_at, b.status, b.total,
                       r.id AS resource_id, r.name, r.category, r.image, r.metadata
                FROM bookings b
                JOIN resources r ON r.id = b.resource_id
                WHERE b.user_id = :user_id
                ORDER BY b.starts_at DESC
                """
            ),
            {"user_id": user["id"]},
        ).mappings().all()

    return [
        {
            "bookingRef": r["booking_ref"],
            "startsAt": r["starts_at"].isoformat(),
            "endsAt": r["ends_at"].isoformat(),
            "status": r["status"],
            "total": float(r["total"]),
            "car": {
                "id": r["resource_id"],
                "name": r["name"],
                "category": r["category"],
                "image": r["image"],
                "metadata": json.loads(r["metadata"]),
            },
        }
        for r in rows
    ]
