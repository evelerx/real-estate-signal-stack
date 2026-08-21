# services/allocation_map_service.py

"""
Allocation Map Buckets
----------------------
Discrete capital attractiveness bands.
"""

def map_bucket(score: float) -> dict:
    if score >= 75:
        return {"bucket": "GREEN", "signal": "ACCUMULATE"}
    elif score >= 60:
        return {"bucket": "LIGHT_GREEN", "signal": "SELECTIVE"}
    elif score >= 45:
        return {"bucket": "YELLOW", "signal": "WATCH"}
    elif score >= 30:
        return {"bucket": "ORANGE", "signal": "CAUTION"}
    else:
        return {"bucket": "RED", "signal": "AVOID"}
