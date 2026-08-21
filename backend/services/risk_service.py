# services/risk_service.py

from services.scoring_service import compute_area_builder_risk

def compute_total_risk_deductions(
    builder_data: list,
    manual_builder_decay: str | None = None,
) -> dict:
    """
    Aggregates all risk deductions.
    Future-proof: more risk modules plug here.
    """

    builder_risk = compute_area_builder_risk(
        area_builders=builder_data,
        manual_decay_flag=manual_builder_decay,
    )

    total_deduction = builder_risk["deduction"]

    return {
        "total_deduction": total_deduction,
        "risk_breakdown": {
            "builder_execution_decay": builder_risk,
        },
    }

