# core/builder_execution.py

from core.risk_weights import (
    BUILDER_SCORE_WEIGHTS,
    BUILDER_EXECUTION_DEDUCTIONS,
)

def compute_builder_execution_score(metrics: dict) -> float:
    """
    metrics = {
        delivery_timeliness: 0–1,
        delay_severity: 0–1,
        project_stacking: 0–1,
        completion_velocity: 0–1
    }
    """
    score = 0.0

    for key, weight in BUILDER_SCORE_WEIGHTS.items():
        score += metrics[key] * weight

    return round(score * 100, 2)


def aggregate_area_builder_score(builders: list) -> float:
    """
    builders = [
        {
            "execution_score": 78.2,
            "area_project_share": 0.45
        }
    ]
    """
    weighted_sum = sum(
        b["execution_score"] * b["area_project_share"]
        for b in builders
    )

    return round(weighted_sum, 2)


def classify_system_signal(score: float) -> str:
    if score >= 70:
        return "STRONG"
    elif score >= 55:
        return "STABLE"
    return "FRAGILE"


def apply_manual_builder_decay(
    system_signal: str,
    manual_flag: str | None
) -> int:
    """
    Governance enforcement:
    STRONG signal cannot receive HIGH decay
    """
    if manual_flag is None:
        return 0

    manual_flag = manual_flag.upper()

    if system_signal == "STRONG" and manual_flag == "HIGH":
        raise ValueError(
            "Governance violation: STRONG signal cannot have HIGH decay"
        )

    return BUILDER_EXECUTION_DEDUCTIONS[manual_flag]
