from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.staff_user import StaffUser
from schemas.staff import StaffUserCreate, StaffUserUpdate, StaffUserOut
from services.db import get_db
from services.rbac import require_roles

ALLOWED_ROLES = {"admin"}

router = APIRouter(prefix="/internal/staff", tags=["Staff Admin"])


@router.get("/users", response_model=list[StaffUserOut])
def list_users(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    return db.query(StaffUser).order_by(StaffUser.created_at.desc()).all()


@router.post("/users", response_model=StaffUserOut)
def create_user(
    payload: StaffUserCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    existing = db.query(StaffUser).filter(StaffUser.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = StaffUser(
        username=payload.username.strip().lower(),
        role="admin",
        password_hash="passwordless-admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=StaffUserOut)
def update_user(
    user_id: int,
    payload: StaffUserUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    user = db.query(StaffUser).filter(StaffUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "admin"

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    user = db.query(StaffUser).filter(StaffUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"status": "deleted", "user_id": user_id}

