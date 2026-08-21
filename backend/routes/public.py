from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.consultation_request import ConsultationRequest
from schemas.consultation import ConsultationCreate, ConsultationCreateResponse
from services.db import get_db

router = APIRouter(prefix="/public", tags=["Public"])


@router.post("/consultations", response_model=ConsultationCreateResponse)
def create_consultation_request(
    payload: ConsultationCreate,
    db: Session = Depends(get_db),
):
    request = ConsultationRequest(
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        phone=(payload.phone or "").strip() or None,
        company=(payload.company or "").strip() or None,
        role=(payload.role or "").strip() or None,
        interest=payload.interest.strip(),
        preferred_date=(payload.preferred_date or "").strip() or None,
        preferred_time=(payload.preferred_time or "").strip() or None,
        message=(payload.message or "").strip() or None,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return ConsultationCreateResponse(id=request.id, status="received")
