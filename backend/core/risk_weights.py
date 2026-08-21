# core/risk_weights.py

BUILDER_EXECUTION_DEDUCTIONS = {
    "LOW": 0,
    "MEDIUM": 5,
    "HIGH": 9,
}

BUILDER_SCORE_WEIGHTS = {
    "delivery_timeliness": 0.35,
    "delay_severity": 0.25,
    "project_stacking": 0.20,
    "completion_velocity": 0.20,
}

