from __future__ import annotations

import json
import os
from typing import Dict, List
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def _api_key() -> str:
    return os.getenv("WAKAD_DATA_API_KEY", "").strip()


def _api_key_header() -> str:
    return os.getenv("WAKAD_DATA_API_KEY_HEADER", "X-API-Key").strip() or "X-API-Key"


def _timeout_seconds() -> float:
    raw = os.getenv("WAKAD_DATA_TIMEOUT_SECONDS", "8").strip()
    try:
        return max(float(raw), 1.0)
    except ValueError:
        return 8.0


def _ensure_configured(url: str) -> None:
    if not url or not url.strip():
        raise ValueError("Wakad API URL is not configured")
    if not _api_key():
        raise ValueError("WAKAD_DATA_API_KEY is not configured")


def _fetch_json(url: str, params: Dict[str, str] | None = None) -> Dict | List:
    _ensure_configured(url)
    final_url = url
    if params:
        query = urlencode({k: v for k, v in params.items() if v is not None})
        if query:
            final_url = f"{url}{'&' if '?' in url else '?'}{query}"

    headers = {
        "Accept": "application/json",
        _api_key_header(): _api_key(),
    }
    req = Request(final_url, headers=headers, method="GET")

    try:
        with urlopen(req, timeout=_timeout_seconds()) as res:
            body = res.read().decode("utf-8")
            return json.loads(body)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Wakad provider HTTP {exc.code}: {body[:200]}") from exc
    except URLError as exc:
        raise RuntimeError(f"Wakad provider connection error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("Wakad provider returned invalid JSON") from exc


def fetch_wakad_snapshot() -> Dict:
    url = os.getenv("WAKAD_SNAPSHOT_API_URL", "").strip()
    payload = _fetch_json(url)
    if not isinstance(payload, dict):
        raise RuntimeError("Wakad snapshot payload must be an object")
    return payload


def fetch_wakad_timeseries() -> List[Dict]:
    url = os.getenv("WAKAD_TIMESERIES_API_URL", "").strip()
    payload = _fetch_json(url)

    series = payload.get("series") if isinstance(payload, dict) else payload
    if not isinstance(series, list):
        raise RuntimeError("Wakad timeseries payload must be a list")

    normalized: List[Dict] = []
    for item in series:
        if not isinstance(item, dict):
            continue
        quarter = str(item.get("quarter", "")).strip()
        if not quarter:
            continue
        normalized.append(
            {
                "quarter": quarter,
                "score": float(item.get("score", 0.0)),
                "confidence": float(item.get("confidence", 0.0)),
                "risk": float(item.get("risk", 0.0)),
            }
        )

    if not normalized:
        raise RuntimeError("Wakad timeseries payload is empty")
    return normalized


def fetch_wakad_heatmap() -> List[Dict]:
    url = os.getenv("WAKAD_HEATMAP_API_URL", "").strip()
    payload = _fetch_json(url)

    rows = payload.get("rows") if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        raise RuntimeError("Wakad heatmap payload must be a list")

    normalized: List[Dict] = []
    for item in rows:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "Wakad")).strip() or "Wakad"
        normalized.append(
            {
                "id": str(item.get("id", "wakad")).strip() or "wakad",
                "name": name,
                "score": float(item.get("score", 0.0)),
                "city": str(item.get("city", "Pune")).strip() or "Pune",
                "state": str(item.get("state", "Maharashtra")).strip()
                or "Maharashtra",
            }
        )

    if not normalized:
        raise RuntimeError("Wakad heatmap payload is empty")
    return normalized
