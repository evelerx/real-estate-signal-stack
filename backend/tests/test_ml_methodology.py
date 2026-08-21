import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.ml_methodology import (  # noqa: E402
    AREA_SCORE_WEIGHTS,
    audit_model_contract,
    compute_area_model,
    get_area_model_formula,
    get_model_methodology,
    get_project_traceability,
    load_model_config,
    logistic_probability,
    minmax_score,
)


def assert_between(value, low, high):
    assert low <= value <= high, f"{value} must be between {low} and {high}"


def test_minmax_and_inverse_scoring():
    assert minmax_score(70, 0, 100) == 70
    assert minmax_score(70, 0, 100, inverse=True) == 30
    assert minmax_score(150, 0, 100) == 100
    assert minmax_score(-10, 0, 100) == 0


def test_logistic_probability_bounds():
    assert_between(logistic_probability(-100), 0, 1)
    assert_between(logistic_probability(0), 0, 1)
    assert_between(logistic_probability(100), 0, 1)
    assert logistic_probability(0) == 0.5


def test_area_model_outputs_and_metadata():
    area = {
        "connectivity": 89,
        "infrastructure": 69,
        "builder_reliability": 64,
        "supply_pressure": 69,
        "search_heat": 46,
    }
    result = compute_area_model(area, adjustment_factor=1.15, risk_deduction=5.0)

    assert_between(result.score, 0, 100)
    assert_between(result.risk_probability_pct, 0, 100)
    assert_between(result.confidence_score, 0, 100)
    assert result.normalized_features["supply_pressure"] == 31
    assert result.formula["feature_weights"] == AREA_SCORE_WEIGHTS


def test_methodology_contract():
    methodology = get_model_methodology()
    assert methodology["title"] == "Real Estate Signal Stack Model Methodology"
    assert methodology["modules"][0]["target"] == "capital_allocation_score"
    assert "recommended_ml_upgrade" in methodology
    assert methodology["base_paper_handoff"]["config_to_update"] == "backend/config/model_config.json"
    assert get_area_model_formula()["config_path"] == "backend/config/model_config.json"


def test_model_config_loads_from_json():
    config = load_model_config()
    assert config["model_version"] == "paper-ready-transparent-v1"
    assert config["source_status"] == "awaiting_base_paper"
    assert config["feature_weights"] == AREA_SCORE_WEIGHTS


def test_model_audit_contract():
    audit = audit_model_contract(
        [
            {
                "id": "wakad",
                "connectivity": 89,
                "infrastructure": 69,
                "builder_reliability": 64,
                "supply_pressure": 69,
                "search_heat": 46,
            }
        ]
    )
    assert audit["status"] == "pass"
    assert audit["rows_checked"] == 1
    assert audit["score_range"]["min"] is not None
    assert audit["formula_endpoint"] == "/api/model/methodology"
    assert audit["config_path"] == "backend/config/model_config.json"
    assert "docs/base-paper-extraction-template.md" in audit["base_paper_template_paths"]


def test_project_traceability_contract():
    traceability = get_project_traceability()
    assert traceability["title"] == "Synopsis To Implementation Traceability"
    assert len(traceability["items"]) >= 5
    assert traceability["base_paper_handoff"]["config_to_update"] == "backend/config/model_config.json"
    statuses = {item["status"] for item in traceability["items"]}
    assert "implemented" in statuses
    assert "blocked_until_base_paper_uploaded" in statuses
