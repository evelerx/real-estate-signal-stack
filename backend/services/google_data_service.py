from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def _read_json(request: Request) -> dict:
    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Google API HTTP {exc.code}: {detail[:180]}") from exc
    except URLError as exc:
        raise RuntimeError(f"Google API connection error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("Google API returned invalid JSON") from exc


def _require(value: str | None, label: str) -> str:
    result = (value or "").strip()
    if not result:
        raise ValueError(f"{label} is required")
    return result


def verify_google_data_credentials(
    maps_api_key: str | None,
    search_api_key: str | None,
    search_engine_id: str | None,
) -> dict:
    maps_key = _require(maps_api_key, "Google Maps API key")
    search_key = (search_api_key or "").strip()
    search_engine = (search_engine_id or "").strip()

    places_request = Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps({"textQuery": "Pune, India", "maxResultCount": 1}).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": maps_key,
            "X-Goog-FieldMask": "places.id",
        },
        method="POST",
    )
    places_payload = _read_json(places_request)
    places_ok = bool(places_payload.get("places"))

    search_status = "not configured - embedded search widget remains available"
    if search_key and search_engine:
        try:
            query = urlencode({"key": search_key, "cx": search_engine, "q": "MahaRERA project registration"})
            search_payload = _read_json(Request(f"https://www.googleapis.com/customsearch/v1?{query}"))
            search_status = "connected" if search_payload.get("items") else "no results returned"
        except RuntimeError:
            search_status = "blocked by Google - embedded search widget remains available"

    return {
        "places": "connected" if places_ok else "no results returned",
        "routes": "optional - using map-distance fallback",
        "programmable_search": search_status,
    }
