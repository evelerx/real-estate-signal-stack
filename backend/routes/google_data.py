from fastapi import APIRouter, Depends, Header, HTTPException

from services.google_data_service import verify_google_data_credentials
from services.rbac import require_roles

router = APIRouter(prefix="/google-data", tags=["Google Data"])


@router.post("/verify")
def verify_google_data(
    maps_api_key: str | None = Header(None, alias="X-Google-Maps-Api-Key"),
    search_api_key: str | None = Header(None, alias="X-Google-Search-Api-Key"),
    search_engine_id: str | None = Header(None, alias="X-Google-Search-Engine-Id"),
    _user=Depends(require_roles(["admin"])),
):
    try:
        return verify_google_data_credentials(maps_api_key, search_api_key, search_engine_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
