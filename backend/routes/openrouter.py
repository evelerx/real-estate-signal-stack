from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from services.openrouter_service import (
    DEFAULT_USAGE_LIMIT_USD,
    chat_completion,
    get_key_status,
)
from services.rbac import require_roles

router = APIRouter(prefix="/openrouter", tags=["OpenRouter"])

ALLOWED_ROLES = ["admin"]


class OpenRouterChatInput(BaseModel):
    model: str = Field(default="openrouter/auto")
    messages: list[dict] = Field(default_factory=list)
    local_usage_usd: float = Field(default=0.0, ge=0)
    local_limit_usd: float = Field(default=DEFAULT_USAGE_LIMIT_USD, gt=0)


def _read_key(openrouter_api_key: str | None) -> str:
    key = (openrouter_api_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="OpenRouter API key is required")
    return key


@router.get("/key-status")
def key_status(
    openrouter_api_key: str | None = Header(None, alias="X-OpenRouter-Api-Key"),
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    try:
        return get_key_status(_read_key(openrouter_api_key))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/chat")
def chat(
    payload: OpenRouterChatInput,
    openrouter_api_key: str | None = Header(None, alias="X-OpenRouter-Api-Key"),
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="At least one message is required")

    try:
        return chat_completion(
            api_key=_read_key(openrouter_api_key),
            model=payload.model,
            messages=payload.messages,
            local_usage_usd=payload.local_usage_usd,
            local_limit_usd=payload.local_limit_usd,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
