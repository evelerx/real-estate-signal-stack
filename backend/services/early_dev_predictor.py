def compute_development_vector(signals: dict) -> dict:
    score = 0

    score += signals.get("infrastructure_pipeline", 0) * 0.30
    score += signals.get("zoning_upgrade", 0) * 0.25
    score += signals.get("builder_entry", 0) * 0.20
    score += signals.get("search_heat_acceleration", 0) * 0.15
    score += signals.get("land_transaction_velocity", 0) * 0.10

    if score >= 70:
        stage = "PRE-INFLECTION"
    elif score >= 50:
        stage = "EMERGING"
    else:
        stage = "STABLE"

    return {
        "development_score": round(score, 2),
        "stage": stage,
    }
