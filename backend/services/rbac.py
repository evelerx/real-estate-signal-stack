from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from services.auth_service import oauth2_scheme, SECRET_KEY, ALGORITHM


def require_roles(required):
    if isinstance(required, str):
        required_roles = {required}
    else:
        required_roles = set(required)

    def guard(token: str = Depends(oauth2_scheme)):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        role = payload.get("role")
        if role not in required_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return payload

    return guard


def require_role(required: str):
    return require_roles(required)
