from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from .base import Base


class RawMetric(Base):
    __tablename__ = "raw_metrics"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(String(128), index=True, nullable=False)
    city = Column(String(128), index=True, nullable=False)
    metric = Column(String(128), index=True, nullable=False)
    value = Column(Float, nullable=False)
    collected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
