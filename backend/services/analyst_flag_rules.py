# services/analyst_flag_rules.py

ANALYST_FLAG_ADJUSTMENTS = {
    "inventory_stress": {
        "LOW": 0.00,
        "MEDIUM": -0.03,
        "HIGH": -0.07,
    },
    "credit_exposure": {
        "NO": 0.00,
        "YES": -0.05,
    },
    "regulatory_risk": {
        "NONE": 0.00,
        "MINOR": -0.02,
        "SEVERE": -0.08,
    },
    "infra_pipeline_visibility": {
        "CONFIRMED": 0.05,
        "RUMORED": 0.02,
        "NONE": 0.00,
    },
}

MAX_NEGATIVE_IMPACT = -0.15
MAX_POSITIVE_IMPACT = 0.10
