# services/area_adjustment_service.py

"""
Area Adjustment Logic
---------------------
Converts structural area characteristics into a bounded adjustment factor.

RULES:
- Deterministic
- Banded (no continuous tuning)
- No analyst discretion here
"""

from typing import Dict

# =========================================================
# DOCUMENTED BANDS (LOCKED)
# =========================================================

CONNECTIVITY_BANDS = [
    (80, 1.15),
    (65, 1.05),
    (50, 1.00),
    (0, 0.90),
]

INFRASTRUCTURE_BANDS = [
    (80, 1.15),
    (65, 1.05),
    (50, 1.00),
    (0, 0.90),
]

SUPPLY_PRESSURE_BANDS = [
    (70, 0.90),   # high pressure → negative
    (50, 0.95),
    (30, 1.00),
    (0, 1.05),
]


# =========================================================
# HELPERS
# =========================================================

def band_lookup(value: int, bands):
    for threshold, factor in bands:
        if value >= threshold:
            return factor
    return 1.0


# =========================================================
# CORE LOGIC
# =========================================================

def compute_area_adjustment(area_metrics: Dict) -> Dict:
    """
    Returns:
    {
        adjustment_factor: float,
        components: dict
    }
    """

    connectivity_factor = band_lookup(
        area_metrics["connectivity"],
        CONNECTIVITY_BANDS,
    )

    infrastructure_factor = band_lookup(
        area_metrics["infrastructure"],
        INFRASTRUCTURE_BANDS,
    )

    supply_factor = band_lookup(
        area_metrics["supply_pressure"],
        SUPPLY_PRESSURE_BANDS,
    )

    adjustment = round(
        connectivity_factor
        * infrastructure_factor
        * supply_factor,
        2
    )

    # Hard bounds (institutional discipline)
    adjustment = min(max(adjustment, 0.6), 1.4)

    return {
        "adjustment_factor": adjustment,
        "components": {
            "connectivity_factor": connectivity_factor,
            "infrastructure_factor": infrastructure_factor,
            "supply_factor": supply_factor,
        },
    }
