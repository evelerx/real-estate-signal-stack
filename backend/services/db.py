import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models.base import Base
import models.staff_user  # noqa: F401 - ensure table is registered
import models.intel_entry  # noqa: F401 - ensure table is registered
import models.consultation_request  # noqa: F401 - ensure table is registered

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./staff_access.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
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
