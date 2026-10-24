import os

import certifi
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()  # safe to call again even if main.py already did — idempotent

connect_args = {}
if os.environ.get("DB_SSL", "false").lower() == "true":
    connect_args["ssl"] = {"ca": certifi.where()}

engine = create_engine(
    os.environ["DATABASE_URL"],
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)
