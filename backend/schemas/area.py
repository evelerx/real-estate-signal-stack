from pydantic import BaseModel
from typing import Dict, Optional


class RiskDeduction(BaseModel):
    total_deduction: float
    risk_breakdown: Dict[str, dict]


class AllocationSignal(BaseModel):
    bucket: str
    signal: str


class ScoreComposition(BaseModel):
    city_macro_score: float
    base_area_score: float
    ml_adjusted_area_score: float | None = None
    risk_probability_pct: float | None = None
    ml_confidence_score: float | None = None
    normalized_features: Dict[str, float] | None = None
    model_formula: Dict | None = None
    area_adjustment_factor: float
    analyst_adjustment_delta: float
    final_adjustment_factor: float
    risk_deductions: RiskDeduction


class AreaSnapshotResponse(BaseModel):
    area: str
    city: str
    snapshot_version: str
    tier: str
    status: str

    capital_allocation_score: float
    allocation_signal: AllocationSignal

    score_composition: ScoreComposition
    data_provenance: Dict

    message: Optional[str] = None
