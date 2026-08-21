# services/macro_service.py

from typing import Dict

from core.geo_data import build_city_macro_inputs

# =========================================================
# CITY MACRO INPUTS (STATIC PROXIES FOR V1)
# Later → APIs / scheduled updates
# =========================================================

CITY_MACRO_INPUTS = build_city_macro_inputs()
CITY_MACRO_INPUTS.update(
    {
        "pune": {
            "interest_rate_regime": "tight",        # loose / neutral / tight
            "credit_growth": "moderate",            # weak / moderate / strong
            "employment_trend": "stable",            # contracting / stable / expanding
            "infra_cycle": "active",                 # inactive / active
            "construction_cycle": "late",            # early / mid / late
        }
    }
)

# =========================================================
# SCORING MAPS (FIXED, DISCLOSED)
# =========================================================

INTEREST_RATE_SCORE = {
    "loose": 80,
    "neutral": 60,
    "tight": 40,
}

CREDIT_GROWTH_SCORE = {
    "weak": 40,
    "moderate": 60,
    "strong": 80,
}

EMPLOYMENT_SCORE = {
    "contracting": 40,
    "stable": 60,
    "expanding": 80,
}

INFRA_SCORE = {
    "inactive": 40,
    "active": 70,
}

CONSTRUCTION_CYCLE_SCORE = {
    "early": 70,
    "mid": 60,
    "late": 45,
}

# =========================================================
# CITY MACRO ENGINE
# =========================================================

def compute_city_macro_score(city_id: str) -> Dict:
    city_key = city_id.lower()

    if city_key not in CITY_MACRO_INPUTS:
        raise ValueError("City macro data not available")

    data = CITY_MACRO_INPUTS[city_key]

    components = {
        "interest_rates": INTEREST_RATE_SCORE[data["interest_rate_regime"]],
        "credit_growth": CREDIT_GROWTH_SCORE[data["credit_growth"]],
        "employment": EMPLOYMENT_SCORE[data["employment_trend"]],
        "infrastructure": INFRA_SCORE[data["infra_cycle"]],
        "construction_cycle": CONSTRUCTION_CYCLE_SCORE[data["construction_cycle"]],
    }

    macro_score = round(sum(components.values()) / len(components), 2)

    # Directional bias (NOT forecast)
    if macro_score >= 70:
        bias = "Expansion"
    elif macro_score >= 55:
        bias = "Neutral"
    else:
        bias = "Contraction"

    return {
        "city": city_key.capitalize(),
        "macro_score": macro_score,
        "bias": bias,
        "components": components,
        "disclaimer": "Macro score reflects structural conditions, not price prediction.",
    }
