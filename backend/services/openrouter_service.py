from __future__ import annotations

import json
from typing import Dict, List
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OPENROUTER_API_URL = "https://openrouter.ai/api/v1"
DEFAULT_USAGE_LIMIT_USD = 0.008


def _headers(api_key: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://real-estate-signal-stack.vercel.app",
        "X-Title": "Real Estate Signal Stack",
    }


def _request(path: str, api_key: str, payload: Dict | None = None) -> Dict:
    if not api_key or not api_key.strip():
        raise ValueError("OpenRouter API key is required")

    body = None
    method = "GET"
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        method = "POST"

    req = Request(
        f"{OPENROUTER_API_URL}{path}",
        data=body,
        headers=_headers(api_key.strip()),
        method=method,
    )

    try:
        with urlopen(req, timeout=20) as res:
            return json.loads(res.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenRouter HTTP {exc.code}: {detail[:300]}") from exc
    except URLError as exc:
        raise RuntimeError(f"OpenRouter connection error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("OpenRouter returned invalid JSON") from exc


def get_key_status(api_key: str) -> Dict:
    payload = _request("/key", api_key)
    data = payload.get("data", {})
    return {
        "label": data.get("label"),
        "usage": float(data.get("usage") or 0.0),
        "limit": data.get("limit"),
        "limit_remaining": data.get("limit_remaining"),
        "limit_reset": data.get("limit_reset"),
        "is_free_tier": bool(data.get("is_free_tier")),
    }


def chat_completion(
    api_key: str,
    model: str,
    messages: List[Dict],
    local_usage_usd: float,
    local_limit_usd: float = DEFAULT_USAGE_LIMIT_USD,
    max_tokens: int = 48,
    web_search: bool = False,
) -> Dict:
    if local_usage_usd >= local_limit_usd:
        raise ValueError("Local OpenRouter usage cap reached")

    payload: Dict = {
        "model": model or "openrouter/auto",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    if web_search:
        payload["tools"] = [
            {
                "type": "openrouter:web_search",
                "parameters": {"engine": "exa", "max_results": 3},
            }
        ]
    return _request("/chat/completions", api_key, payload)
