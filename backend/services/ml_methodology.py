from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(float(value), hi))


def minmax_score(value: float, low: float, high: float, inverse: bool = False) -> float:
    if high == low:
        return 50.0
    score = (float(value) - low) / (high - low) * 100.0
    if inverse:
        score = 100.0 - score
    return clamp(score)


def weighted_sum(features: dict[str, float], weights: dict[str, float]) -> float:
    total_weight = sum(abs(weight) for weight in weights.values()) or 1.0
    score = sum(features.get(key, 0.0) * weight for key, weight in weights.items())
    return clamp(score / total_weight)


def logistic_probability(linear_score: float) -> float:
    return 1.0 / (1.0 + math.exp(-linear_score))


@dataclass(frozen=True)
class AreaModelResult:
    score: float
    risk_probability_pct: float
    confidence_score: float
    normalized_features: dict[str, float]
    formula: dict


AREA_FEATURE_RANGES = {
    "connectivity": (0.0, 100.0, False),
    "infrastructure": (0.0, 100.0, False),
    "builder_reliability": (0.0, 100.0, False),
    "supply_pressure": (0.0, 100.0, True),
    "search_heat": (0.0, 100.0, False),
}

AREA_SCORE_WEIGHTS = {
    "connectivity": 0.25,
    "infrastructure": 0.20,
    "builder_reliability": 0.20,
    "supply_pressure": 0.20,
    "search_heat": 0.15,
}

RISK_LOGIT_WEIGHTS = {
    "intercept": -2.10,
    "supply_pressure": 0.030,
    "builder_reliability": -0.026,
    "infrastructure": -0.014,
    "connectivity": -0.012,
    "search_heat": -0.006,
}


def normalize_area_features(area: dict) -> dict[str, float]:
    normalized = {}
    for key, (low, high, inverse) in AREA_FEATURE_RANGES.items():
        normalized[key] = minmax_score(area.get(key, 0.0), low, high, inverse=inverse)
    return normalized


def compute_area_model(
    area: dict,
    adjustment_factor: float = 1.0,
    analyst_delta: float = 0.0,
    risk_deduction: float = 0.0,
) -> AreaModelResult:
    normalized = normalize_area_features(area)
    base_score = weighted_sum(normalized, AREA_SCORE_WEIGHTS)
    adjusted_score = clamp(base_score * adjustment_factor - risk_deduction)

    logit = RISK_LOGIT_WEIGHTS["intercept"]
    logit += float(area.get("supply_pressure", 0.0)) * RISK_LOGIT_WEIGHTS["supply_pressure"]
    logit += float(area.get("builder_reliability", 0.0)) * RISK_LOGIT_WEIGHTS["builder_reliability"]
    logit += float(area.get("infrastructure", 0.0)) * RISK_LOGIT_WEIGHTS["infrastructure"]
    logit += float(area.get("connectivity", 0.0)) * RISK_LOGIT_WEIGHTS["connectivity"]
    logit += float(area.get("search_heat", 0.0)) * RISK_LOGIT_WEIGHTS["search_heat"]
    risk_probability = logistic_probability(logit) * 100.0

    confidence = clamp(
        72.0
        + normalized["builder_reliability"] * 0.12
        + normalized["connectivity"] * 0.08
        - abs(analyst_delta) * 28.0
        - risk_deduction * 0.45
        - risk_probability * 0.16
    )

    return AreaModelResult(
        score=round(adjusted_score, 2),
        risk_probability_pct=round(risk_probability, 2),
        confidence_score=round(confidence, 2),
        normalized_features={key: round(value, 2) for key, value in normalized.items()},
        formula=get_area_model_formula(),
    )


def get_area_model_formula() -> dict:
    return {
        "model_family": "transparent hybrid ML scoring",
        "score_formula": "weighted_sum(minmax_normalized_features) adjusted by analyst_delta and risk_deduction",
        "risk_formula": "logistic(intercept + weighted raw risk indicators)",
        "normalization": "min-max normalization to 0-100; supply pressure is inverse-scored for opportunity",
        "feature_weights": AREA_SCORE_WEIGHTS,
        "risk_logit_weights": RISK_LOGIT_WEIGHTS,
        "feature_ranges": {
            key: {"low": low, "high": high, "inverse": inverse}
            for key, (low, high, inverse) in AREA_FEATURE_RANGES.items()
        },
        "paper_alignment_note": (
            "Designed to match common real-estate intelligence papers that combine "
            "location quality, infrastructure growth, developer execution, supply risk, "
            "and demand/search signals. Replace weights with the base-paper coefficients "
            "when the source document is added to the repo."
        ),
    }


def get_model_methodology() -> dict:
    return {
        "title": "Real Estate Signal Stack Model Methodology",
        "modules": [
            {
                "name": "Area Opportunity Score",
                "target": "capital_allocation_score",
                "formula": get_area_model_formula(),
            },
            {
                "name": "Supply And Execution Risk",
                "target": "risk_probability_pct",
                "formula": "P(risk)=1/(1+e^-z), where z is a weighted sum of supply and execution indicators.",
            },
            {
                "name": "Confidence Band",
                "target": "confidence_score",
                "formula": "starts from data quality baseline and deducts volatility, overrides, model risk, and stale inputs",
            },
        ],
        "expected_training_columns": [
            "connectivity",
            "infrastructure",
            "builder_reliability",
            "supply_pressure",
            "search_heat",
            "price_growth",
            "absorption_rate",
            "inventory_months",
            "rental_yield",
        ],
        "recommended_ml_upgrade": (
            "Train Random Forest, Gradient Boosting, or XGBoost regression for price-growth/ROI prediction, "
            "and logistic regression for binary investment-risk classification once historical labelled data is available."
        ),
    }


def score_dataset(rows: Iterable[dict]) -> list[dict]:
    output = []
    for row in rows:
        result = compute_area_model(row)
        output.append(
            {
                **row,
                "ml_score": result.score,
                "risk_probability_pct": result.risk_probability_pct,
                "confidence_score": result.confidence_score,
            }
        )
    return output
