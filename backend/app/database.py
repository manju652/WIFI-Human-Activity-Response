"""
Database configuration.

Defaults to SQLite (file-based, zero setup) for easy local development.
Set DATABASE_URL to a PostgreSQL DSN (as provisioned by docker-compose.yml)
for a production-style deployment:

  DATABASE_URL=postgresql://wifi_user:wifi_pass@postgres:5432/wifi_har

Both work identically through SQLAlchemy - no application code changes
needed to switch.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wifi_har.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from . import models  # noqa: ensure models are registered on Base
    Base.metadata.create_all(bind=engine)
