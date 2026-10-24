import json
import re
import uuid
from pathlib import Path

from sqlalchemy import text

from auth import hash_password
from data.resources import RESOURCES
from database import engine

ADMIN_EMAIL = "admin@carrental.dev"
ADMIN_PASSWORD = "admin123"


def _statements(sql: str) -> list[str]:
    # schema.sql is fully controlled and simple (no stored procedures, no semicolons inside
    # string literals) so a naive split is safe here — SQLAlchemy/PyMySQL won't run a
    # multi-statement string in one execute() call the way node-postgres can.
    return [s.strip() for s in re.split(r";\s*\n", sql) if s.strip()]


def migrate():
    schema_sql = Path(__file__).parent.joinpath("schema.sql").read_text()
    with engine.begin() as conn:
        for statement in _statements(schema_sql):
            conn.execute(text(statement))

        for r in RESOURCES:
            conn.execute(
                text(
                    """
                    INSERT INTO resources (id, name, category, description, image, price, capacity, metadata)
                    VALUES (:id, :name, :category, :description, :image, :price, :capacity, :metadata)
                    ON DUPLICATE KEY UPDATE id = id
                    """
                ),
                {**r, "metadata": json.dumps(r.get("metadata", {}))},
            )

        conn.execute(
            text(
                """
                INSERT INTO users (id, email, password_hash, name, is_admin)
                VALUES (:id, :email, :password_hash, :name, TRUE)
                ON DUPLICATE KEY UPDATE id = id
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "name": "Fleet Admin",
            },
        )

    print(f"Migrated schema and seeded {len(RESOURCES)} cars.")
    print(f"Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    migrate()
