from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from .base import Base


class IntelEntry(Base):
    __tablename__ = "intel_entries"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(String(128), unique=True, index=True, nullable=False)
    listings_json = Column(Text, nullable=False, default="[]")
    broker_deals_json = Column(Text, nullable=False, default="[]")
    validations_json = Column(Text, nullable=False, default="[]")
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
