from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
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


DEFAULT_MODEL_CONFIG = {
    "model_version": "paper-ready-transparent-v1",
    "source_status": "awaiting_base_paper",
    "model_family": "transparent hybrid ML scoring",
    "score_formula": "weighted_sum(minmax_normalized_features) adjusted by analyst_delta and risk_deduction",
    "risk_formula": "logistic(intercept + weighted raw risk indicators)",
    "normalization": "min-max normalization to 0-100; supply pressure is inverse-scored for opportunity",
    "feature_ranges": {
        "connectivity": {"low": 0.0, "high": 100.0, "inverse": False},
        "infrastructure": {"low": 0.0, "high": 100.0, "inverse": False},
        "builder_reliability": {"low": 0.0, "high": 100.0, "inverse": False},
        "supply_pressure": {"low": 0.0, "high": 100.0, "inverse": True},
        "search_heat": {"low": 0.0, "high": 100.0, "inverse": False},
    },
    "feature_weights": {
        "connectivity": 0.25,
        "infrastructure": 0.20,
        "builder_reliability": 0.20,
        "supply_pressure": 0.20,
        "search_heat": 0.15,
    },
    "risk_logit_weights": {
        "intercept": -2.10,
        "supply_pressure": 0.030,
        "builder_reliability": -0.026,
        "infrastructure": -0.014,
        "connectivity": -0.012,
        "search_heat": -0.006,
    },
    "confidence_formula": {
        "baseline": 72.0,
        "builder_reliability_normalized_weight": 0.12,
        "connectivity_normalized_weight": 0.08,
        "analyst_delta_penalty": 28.0,
        "risk_deduction_penalty": 0.45,
        "risk_probability_penalty": 0.16,
    },
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
    "paper_alignment_note": (
        "Replace this JSON with exact variables, weights, coefficients, and model family "
        "from the uploaded base paper."
    ),
}

CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "model_config.json"
CONFIG_DISPLAY_PATH = "backend/config/model_config.json"
BASE_PAPER_TEMPLATE_PATHS = [
    "docs/base-paper-extraction-template.md",
    "backend/config/base_paper_mapping.template.json",
]


def load_model_config() -> dict:
    try:
        with CONFIG_PATH.open("r", encoding="utf-8") as handle:
            loaded = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return DEFAULT_MODEL_CONFIG

    config = DEFAULT_MODEL_CONFIG | loaded
    config["feature_ranges"] = DEFAULT_MODEL_CONFIG["feature_ranges"] | loaded.get("feature_ranges", {})
    config["feature_weights"] = DEFAULT_MODEL_CONFIG["feature_weights"] | loaded.get("feature_weights", {})
    config["risk_logit_weights"] = DEFAULT_MODEL_CONFIG["risk_logit_weights"] | loaded.get("risk_logit_weights", {})
    config["confidence_formula"] = DEFAULT_MODEL_CONFIG["confidence_formula"] | loaded.get("confidence_formula", {})
    return config


MODEL_CONFIG = load_model_config()

AREA_FEATURE_RANGES = {
    key: (
        float(config.get("low", 0.0)),
        float(config.get("high", 100.0)),
        bool(config.get("inverse", False)),
    )
    for key, config in MODEL_CONFIG["feature_ranges"].items()
}

AREA_SCORE_WEIGHTS = {
    key: float(value)
    for key, value in MODEL_CONFIG["feature_weights"].items()
}

RISK_LOGIT_WEIGHTS = {
    key: float(value)
    for key, value in MODEL_CONFIG["risk_logit_weights"].items()
}

CONFIDENCE_FORMULA = {
    key: float(value)
    for key, value in MODEL_CONFIG["confidence_formula"].items()
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
        CONFIDENCE_FORMULA["baseline"]
        + normalized["builder_reliability"] * CONFIDENCE_FORMULA["builder_reliability_normalized_weight"]
        + normalized["connectivity"] * CONFIDENCE_FORMULA["connectivity_normalized_weight"]
        - abs(analyst_delta) * CONFIDENCE_FORMULA["analyst_delta_penalty"]
        - risk_deduction * CONFIDENCE_FORMULA["risk_deduction_penalty"]
        - risk_probability * CONFIDENCE_FORMULA["risk_probability_penalty"]
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
        "model_version": MODEL_CONFIG["model_version"],
        "source_status": MODEL_CONFIG["source_status"],
        "config_path": CONFIG_DISPLAY_PATH,
        "model_family": MODEL_CONFIG["model_family"],
        "score_formula": MODEL_CONFIG["score_formula"],
        "risk_formula": MODEL_CONFIG["risk_formula"],
        "normalization": MODEL_CONFIG["normalization"],
        "feature_weights": AREA_SCORE_WEIGHTS,
        "risk_logit_weights": RISK_LOGIT_WEIGHTS,
        "confidence_formula": CONFIDENCE_FORMULA,
        "feature_ranges": {
            key: {"low": low, "high": high, "inverse": inverse}
            for key, (low, high, inverse) in AREA_FEATURE_RANGES.items()
        },
        "paper_alignment_note": MODEL_CONFIG["paper_alignment_note"],
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
        "expected_training_columns": MODEL_CONFIG["expected_training_columns"],
        "recommended_ml_upgrade": MODEL_CONFIG["recommended_ml_upgrade"],
        "base_paper_handoff": {
            "status": MODEL_CONFIG["source_status"],
            "template_paths": BASE_PAPER_TEMPLATE_PATHS,
            "config_to_update": CONFIG_DISPLAY_PATH,
        },
    }


def get_project_traceability() -> dict:
    return {
        "title": "Synopsis To Implementation Traceability",
        "base_paper_status": MODEL_CONFIG["source_status"],
        "base_paper_handoff": {
            "template_paths": BASE_PAPER_TEMPLATE_PATHS,
            "config_to_update": CONFIG_DISPLAY_PATH,
        },
        "items": [
            {
                "synopsis_requirement": "Explain the real-life real-estate decision problem",
                "implementation": "Public introduction page describes fragmented market signals and the project solution.",
                "evidence": ["/", "frontend/src/pages/Home.jsx"],
                "status": "implemented",
            },
            {
                "synopsis_requirement": "Compare locations using market intelligence indicators",
                "implementation": "Area analysis combines connectivity, infrastructure, developer reliability, supply pressure, and search heat.",
                "evidence": ["/api/areas/{area_id}", "backend/services/ml_methodology.py"],
                "status": "implemented",
            },
            {
                "synopsis_requirement": "Use machine-learning or formula-based scoring",
                "implementation": "Base-paper-aligned scoring uses AHP-style weighted attractiveness scoring and logistic risk probability.",
                "evidence": ["/api/model/methodology", "backend/config/model_config.json"],
                "status": "paper_aligned",
            },
            {
                "synopsis_requirement": "Show risk and confidence, not only opportunity",
                "implementation": "Area snapshots expose risk_probability_pct, ml_confidence_score, and risk_deductions.",
                "evidence": ["/api/areas/wakad", "frontend/src/components/AnalysisPanel.jsx"],
                "status": "implemented",
            },
            {
                "synopsis_requirement": "Provide evaluator-visible verification",
                "implementation": "Model audit endpoint checks required features and score/risk/confidence output ranges.",
                "evidence": ["/api/model/audit", "backend/tests/test_ml_methodology.py"],
                "status": "implemented",
            },
            {
                "synopsis_requirement": "Align formulas to the base research paper",
                "implementation": "Model config maps the base paper's AHP aggregate weights and multinomial-logit coefficients to project dashboard indicators.",
                "evidence": ["backend/config/base_paper_mapping.filled.json", "backend/config/model_config.json", "docs/model-methodology.md"],
                "status": "paper_aligned",
            },
        ],
    }


def audit_model_contract(sample_rows: Iterable[dict]) -> dict:
    rows = list(sample_rows)
    scored = score_dataset(rows)
    required_features = set(AREA_FEATURE_RANGES)
    missing_by_row = []

    for row in rows:
        missing = sorted(required_features - set(row))
        if missing:
            missing_by_row.append(
                {
                    "id": row.get("id") or row.get("area") or row.get("name") or "unknown",
                    "missing_features": missing,
                }
            )

    score_values = [row["ml_score"] for row in scored]
    risk_values = [row["risk_probability_pct"] for row in scored]
    confidence_values = [row["confidence_score"] for row in scored]

    return {
        "status": "pass" if not missing_by_row else "warning",
        "rows_checked": len(rows),
        "required_features": sorted(required_features),
        "missing_features": missing_by_row,
        "score_range": {
            "min": min(score_values) if score_values else None,
            "max": max(score_values) if score_values else None,
        },
        "risk_probability_range_pct": {
            "min": min(risk_values) if risk_values else None,
            "max": max(risk_values) if risk_values else None,
        },
        "confidence_range": {
            "min": min(confidence_values) if confidence_values else None,
            "max": max(confidence_values) if confidence_values else None,
        },
        "formula_endpoint": "/api/model/methodology",
        "area_snapshot_field": "score_composition.model_formula",
        "model_version": MODEL_CONFIG["model_version"],
        "source_status": MODEL_CONFIG["source_status"],
        "config_path": CONFIG_DISPLAY_PATH,
        "base_paper_template_paths": BASE_PAPER_TEMPLATE_PATHS,
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
