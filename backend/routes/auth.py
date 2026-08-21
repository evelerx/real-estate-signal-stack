from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.auth_service import authenticate, issue_tokens
from services.db import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginInput(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = authenticate(payload.username, payload.password, db)
    return issue_tokens(user)

@router.post("/refresh")
def refresh():
    # placeholder – wired later
    return {"status": "refresh issued"}
