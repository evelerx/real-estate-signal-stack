from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from services.google_data_service import (
    search_programmable_search,
    verify_google_data_credentials,
)
from services.rbac import require_roles

router = APIRouter(prefix="/google-data", tags=["Google Data"])


class ResearchSearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=300)


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


@router.post("/research-search")
def research_search(
    payload: ResearchSearchRequest,
    search_api_key: str | None = Header(None, alias="X-Google-Search-Api-Key"),
    search_engine_id: str | None = Header(None, alias="X-Google-Search-Engine-Id"),
    _user=Depends(require_roles(["admin"])),
):
    try:
        return search_programmable_search(search_api_key, search_engine_id, payload.query)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        # The client falls back to the embedded PSE when the JSON API is unavailable.
        raise HTTPException(status_code=502, detail=str(exc)) from exc
