from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from .base import Base


class QuarterlyAnalysis(Base):
    __tablename__ = "quarterly_analysis"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(String(128), index=True, nullable=False)
    city = Column(String(128), index=True, nullable=False)
    quarter = Column(String(16), index=True, nullable=False)  # e.g. 2024-Q1
    score = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
