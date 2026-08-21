from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from .base import Base


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(40), nullable=True)
    company = Column(String(160), nullable=True)
    role = Column(String(120), nullable=True)
    interest = Column(String(200), nullable=False)
    preferred_date = Column(String(20), nullable=True)
    preferred_time = Column(String(80), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="new")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
