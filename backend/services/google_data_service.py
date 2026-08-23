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
    search_key = _require(search_api_key, "Google Search API key")
    search_engine = _require(search_engine_id, "Google Search Engine ID")

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

    routes_request = Request(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        data=json.dumps(
            {
                "origin": {"location": {"latLng": {"latitude": 18.5204, "longitude": 73.8567}}},
                "destination": {"location": {"latLng": {"latitude": 19.076, "longitude": 72.8777}}},
                "travelMode": "DRIVE",
            }
        ).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": maps_key,
            "X-Goog-FieldMask": "routes.distanceMeters",
        },
        method="POST",
    )
    routes_payload = _read_json(routes_request)
    routes_ok = bool(routes_payload.get("routes"))

    query = urlencode({"key": search_key, "cx": search_engine, "q": "MahaRERA project registration"})
    search_payload = _read_json(Request(f"https://www.googleapis.com/customsearch/v1?{query}"))
    search_ok = bool(search_payload.get("items"))

    return {
        "places": "connected" if places_ok else "no results returned",
        "routes": "connected" if routes_ok else "no routes returned",
        "programmable_search": "connected" if search_ok else "no results returned",
    }
