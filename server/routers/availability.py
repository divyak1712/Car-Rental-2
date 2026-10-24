from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from database import engine

router = APIRouter()


@router.get("/{resource_id}")
def get_booked_ranges(resource_id: int):
    # Cars are booked over free-form pickup/return dates, not fixed slots, so there is no
    # candidate-slot generation here — just the existing confirmed bookings for this car so the
    # frontend can block those ranges out on a date-range picker. The server-side overlap check
    # in bookings.py (not this endpoint) is what actually enforces no double-booking.
    with engine.begin() as conn:
        resource = conn.execute(text("SELECT id FROM resources WHERE id = :id"), {"id": resource_id}).first()
        if not resource:
            raise HTTPException(404, "Resource not found")

        booked = conn.execute(
            text(
                """
                SELECT starts_at, ends_at FROM bookings
                WHERE resource_id = :id AND status = 'confirmed' AND ends_at >= UTC_TIMESTAMP()
                ORDER BY starts_at
                """
            ),
            {"id": resource_id},
        ).all()

    return [{"startsAt": b.starts_at.isoformat(), "endsAt": b.ends_at.isoformat()} for b in booked]
