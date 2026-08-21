from datetime import datetime, timedelta
import hashlib
import hmac
import os
import secrets

from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from models.staff_user import StaffUser

SECRET_KEY = "CHANGE_THIS_IN_ENV"
ALGORITHM = "HS256"
REFRESH_TTL_DAYS = 7
# Temporary dev-friendly TTL to reduce session expiry during long dashboard use.
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

CEO_USERNAME = os.getenv("CEO_USERNAME", "ceo")
CEO_PASSWORD = os.getenv("CEO_PASSWORD", "ceo123")

def create_token(data: dict, expires_delta: timedelta):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        120_000,
    ).hex()
    return f"{salt}${hashed}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split("$", 1)
    except ValueError:
        return False
    test = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        120_000,
    ).hex()
    return hmac.compare_digest(test, hashed)


def authenticate(username: str, password: str, db: Session):
    normalized = username.strip().lower()
    if normalized == CEO_USERNAME.lower() and password == CEO_PASSWORD:
        return {"username": normalized, "role": "ceo"}

    user = (
        db.query(StaffUser)
        .filter(StaffUser.username == normalized, StaffUser.is_active.is_(True))
        .first()
    )
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"username": user.username, "role": user.role}

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
