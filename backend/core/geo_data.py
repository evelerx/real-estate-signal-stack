from __future__ import annotations

from typing import Dict, List

# NOTE: Keep in sync with frontend/src/data/indiaGeo.js
INDIA_GEO: List[Dict] = [
    {
        "state": "Gujarat",
        "cities": [
            {"name": "Ahmedabad", "areas": ["SG Highway", "Bopal", "Thaltej"]},
            {"name": "Surat", "areas": ["Vesu", "Adajan", "Pal"]},
            {"name": "Vadodara", "areas": ["Alkapuri", "Gotri", "Manjalpur"]},
        ],
    },
    {
        "state": "Maharashtra",
        "cities": [
            {"name": "Mumbai", "areas": ["Bandra West", "Andheri West", "Powai"]},
            {"name": "Pune", "areas": ["Wakad", "Hinjewadi", "Baner"]},
            {"name": "Nagpur", "areas": ["Civil Lines", "Dharampeth", "Manish Nagar"]},
        ],
    },
    {
        "state": "Madhya Pradesh",
        "cities": [
            {"name": "Bhopal", "areas": ["Arera Colony", "MP Nagar", "Kolar Road"]},
            {"name": "Indore", "areas": ["Vijay Nagar", "Palasia", "Scheme 78"]},
        ],
    },
    {
        "state": "Rajasthan",
        "cities": [
            {"name": "Jaipur", "areas": ["Vaishali Nagar", "Malviya Nagar", "C Scheme"]},
            {"name": "Udaipur", "areas": ["Hiran Magri", "Fatehpura", "Bhopalpura"]},
            {"name": "Jodhpur", "areas": ["Sardarpura", "Ratanada", "Paota"]},
        ],
    },
    {
        "state": "Uttar Pradesh",
        "cities": [
            {"name": "Lucknow", "areas": ["Gomti Nagar", "Aliganj", "Hazratganj"]},
            {"name": "Noida", "areas": ["Sector 62", "Sector 137", "Sector 150"]},
            {
                "name": "Ghaziabad",
                "areas": ["Vaishali", "Indirapuram", "Raj Nagar Extension"],
            },
        ],
    },
    {
        "state": "Telangana",
        "cities": [
            {"name": "Hyderabad", "areas": ["Gachibowli", "Hitec City", "Kondapur"]},
            {"name": "Warangal", "areas": ["Hanamkonda", "Kazipet", "Subedari"]},
        ],
    },
    {
        "state": "Goa",
        "cities": [
            {"name": "Panaji", "areas": ["Altinho", "Miramar", "Dona Paula"]},
            {"name": "Margao", "areas": ["Fatorda", "Colva", "Benaulim"]},
        ],
    },
    {
        "state": "Karnataka",
        "cities": [
            {
                "name": "Bengaluru",
                "areas": ["Whitefield", "Koramangala", "Sarjapur Road"],
            },
            {"name": "Mysuru", "areas": ["Vijayanagar", "Jayalakshmipuram", "Hebbal"]},
            {"name": "Mangaluru", "areas": ["Kadri", "Bendoor", "Derebail"]},
        ],
    },
    {
        "state": "Daman and Diu",
        "cities": [
            {"name": "Daman", "areas": ["Moti Daman", "Nani Daman", "Marwad"]},
            {"name": "Diu", "areas": ["Fudam", "Bucharvada", "Vanakbara"]},
        ],
    },
]


def _hash_string(input_value: str) -> int:
    value = 0
    for ch in input_value:
        value = (value << 5) - value + ord(ch)
        value &= 0xFFFFFFFF
    return abs(value)


def _score_from_name(name: str, min_val: int, max_val: int) -> int:
    span = max_val - min_val
    return min_val + (_hash_string(name) % max(span, 1))


def build_area_data() -> Dict[str, Dict]:
    data: Dict[str, Dict] = {}

    for state_item in INDIA_GEO:
        state = state_item["state"]
        for city_item in state_item["cities"]:
            city = city_item["name"]
            for area in city_item["areas"]:
                key = area.lower()
                data[key] = {
                    "city": city,
                    "state": state,
                    "connectivity": _score_from_name(f"{city}-{area}-c", 55, 90),
                    "infrastructure": _score_from_name(f"{city}-{area}-i", 50, 88),
                    "builder_reliability": _score_from_name(f"{city}-{area}-b", 52, 90),
                    "supply_pressure": _score_from_name(f"{city}-{area}-s", 40, 78),
                    "search_heat": _score_from_name(f"{city}-{area}-h", 45, 92),
                }

    return data


def build_area_access(area_data: Dict[str, Dict]) -> Dict[str, Dict]:
    access: Dict[str, Dict] = {}
    for area_key in area_data.keys():
        unlocked = _hash_string(area_key) % 4 != 0
        access[area_key] = {
            "tier": "free" if unlocked else "paid",
            "unlocked": unlocked,
        }
    return access


def build_city_macro_inputs() -> Dict[str, Dict]:
    interest_rate_regimes = ["loose", "neutral", "tight"]
    credit_growth = ["weak", "moderate", "strong"]
    employment_trend = ["contracting", "stable", "expanding"]
    infra_cycle = ["inactive", "active"]
    construction_cycle = ["early", "mid", "late"]

    inputs: Dict[str, Dict] = {}

    for state_item in INDIA_GEO:
        for city_item in state_item["cities"]:
            city = city_item["name"]
            h = _hash_string(city.lower())
            inputs[city.lower()] = {
                "interest_rate_regime": interest_rate_regimes[h % len(interest_rate_regimes)],
                "credit_growth": credit_growth[(h // 3) % len(credit_growth)],
                "employment_trend": employment_trend[(h // 9) % len(employment_trend)],
                "infra_cycle": infra_cycle[(h // 27) % len(infra_cycle)],
                "construction_cycle": construction_cycle[
                    (h // 54) % len(construction_cycle)
                ],
            }

    return inputs
