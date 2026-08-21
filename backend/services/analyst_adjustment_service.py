from datetime import datetime

from services.analyst_admin import ANALYST_ADJUSTMENTS
from config import VALID_SNAPSHOTS


def compute_analyst_adjustment(area_key: str, snapshot_version: str) -> dict:
    """
    Safe, non-destructive analyst adjustment resolver.
    Always returns valid defaults.
    """

    area_key = area_key.lower()
    area_adjustments = ANALYST_ADJUSTMENTS.get(area_key, {})

    if not area_adjustments:
        return {
            "analyst_adjustment_delta": 0.0,
            "override_age_quarters": 0,
            "recent_override_count": 0,
        }

    delta = 0.0
    latest_quarter = None

    for quarter, value in area_adjustments.items():
        delta += float(value)
        latest_quarter = quarter

    # ---- OVERRIDE AGE ----
    snapshots = list(VALID_SNAPSHOTS.keys())
    snapshots.sort()

    override_age_quarters = 0
    if latest_quarter and snapshot_version in snapshots:
        override_age_quarters = max(
            0,
            snapshots.index(snapshot_version)
        )

    return {
        "analyst_adjustment_delta": round(delta, 3),
        "override_age_quarters": override_age_quarters,
        "recent_override_count": len(area_adjustments),
    }
