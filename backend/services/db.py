import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from models.base import Base
import models.staff_user  # noqa: F401 - ensure table is registered
import models.intel_entry  # noqa: F401 - ensure table is registered
import models.consultation_request  # noqa: F401 - ensure table is registered

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./staff_access.db").strip()

# Supabase's transaction pooler is PostgreSQL-compatible but must not retain
# long-lived connections or server-side prepared statements between requests.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require", "prepare_threshold": None},
        poolclass=NullPool,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
