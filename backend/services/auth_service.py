from datetime import datetime, timedelta
import os

from jose import jwt
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

SECRET_KEY = "CHANGE_THIS_IN_ENV"
ALGORITHM = "HS256"
REFRESH_TTL_DAYS = 7
# Temporary dev-friendly TTL to reduce session expiry during long dashboard use.
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")

def create_token(data: dict, expires_delta: timedelta):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate(username: str | None = None, password: str | None = None, db: Session | None = None):
    normalized = (username or ADMIN_USERNAME).strip().lower() or ADMIN_USERNAME
    if normalized == ADMIN_USERNAME.lower():
        return {"username": normalized, "role": "admin"}

    raise HTTPException(status_code=401, detail="Use the admin account for this portal")

def issue_tokens(user: dict):
    access = create_token(
        {"sub": user["username"], "role": user["role"]},
        timedelta(minutes=ACCESS_TTL_MIN),
    )
    refresh = create_token(
        {"sub": user["username"], "type": "refresh"},
        timedelta(days=REFRESH_TTL_DAYS),
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user["role"],
        "username": user["username"],
    }
