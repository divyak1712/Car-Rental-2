import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from auth import get_current_user
from database import engine

router = APIRouter()


class BookingCreate(BaseModel):
    resource_id: int
    starts_at: str  # ISO 8601 date/datetime, treated as UTC
    ends_at: str


def _compute_total(price: float, starts_at: datetime, ends_at: datetime) -> float:
    days = max(1, (ends_at.date() - starts_at.date()).days)
    return round(float(price) * days, 2)


@router.post("")
def create_booking(body: BookingCreate, user: dict = Depends(get_current_user)):
    try:
        starts_at = datetime.fromisoformat(body.starts_at)
        ends_at = datetime.fromisoformat(body.ends_at)
    except ValueError:
        raise HTTPException(422, "Invalid date format")

    if ends_at <= starts_at:
        raise HTTPException(422, "Return date must be after pickup date")

    with engine.begin() as conn:  # BEGIN ... COMMIT/ROLLBACK, one connection for the whole thing
        resource = conn.execute(
            text("SELECT * FROM resources WHERE id = :id FOR UPDATE"), {"id": body.resource_id}
        ).mappings().first()
        if not resource:
            raise HTTPException(404, "Car not found")

        overlap = conn.execute(
            text(
                """
                SELECT id FROM bookings
                WHERE resource_id = :id AND status = 'confirmed'
                  AND starts_at < :ends_at AND ends_at > :starts_at
                LIMIT 1
                """
            ),
            {"id": body.resource_id, "starts_at": starts_at, "ends_at": ends_at},
        ).first()
        if overlap:
            raise HTTPException(409, "That car is already booked for part of this date range. Please pick another range.")

        total = _compute_total(resource["price"], starts_at, ends_at)  # server computes price, never trusts the client
        booking_ref = f"BK-{int(time.time() * 1000)}"
        try:
            conn.execute(
                text(
                    """
                    INSERT INTO bookings (booking_ref, resource_id, user_id, starts_at, ends_at, total)
                    VALUES (:ref, :resource_id, :user_id, :starts_at, :ends_at, :total)
                    """
                ),
                {
                    "ref": booking_ref, "resource_id": body.resource_id, "user_id": user["id"],
                    "starts_at": starts_at, "ends_at": ends_at, "total": total,
                },
            )
        except IntegrityError as err:
            # 1062 = duplicate entry — the UNIQUE(resource_id, starts_at) constraint caught an
            # exact-pickup-time race that somehow reached here without FOR UPDATE serializing it
            # (belt-and-suspenders; the FOR UPDATE lock above should already prevent this).
            if getattr(err.orig, "args", [None])[0] == 1062:
                raise HTTPException(409, "That car was just booked. Please pick another date range.")
            raise

    return {"bookingRef": booking_ref, "startsAt": starts_at.isoformat(), "endsAt": ends_at.isoformat(), "total": total}
