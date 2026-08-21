# services/scoring_service.py

from core.builder_execution import (
    aggregate_area_builder_score,
    classify_system_signal,
    apply_manual_builder_decay,
)

def compute_area_builder_risk(
    area_builders: list,
    manual_decay_flag: str | None = None
) -> dict:
    """
    INTERNAL USE ONLY

    area_builders = [
        {
            "execution_score": 72.4,
            "area_project_share": 0.6
        }
    ]
    """
    area_score = aggregate_area_builder_score(area_builders)
    system_signal = classify_system_signal(area_score)

    deduction = apply_manual_builder_decay(
        system_signal=system_signal,
        manual_flag=manual_decay_flag,
    )

    return {
        "system_signal": system_signal,
        "deduction": deduction,
    }
