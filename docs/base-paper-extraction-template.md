# Base Paper Extraction Template

Use this checklist when the referenced "Real Estate Intelligence" base paper is added to the project. The goal is to translate the paper into `backend/config/model_config.json` without changing application code.

## 1. Paper Identity

Record:

```text
paper_title:
authors:
publication_year:
publication_or_conference:
doi_or_url:
pages_used_for_model:
```

## 2. Research Objective

Extract the paper's prediction or classification target:

```text
target_variable:
target_type: regression | classification | ranking | clustering
business_meaning:
```

Examples:

```text
price_growth_pct
investment_risk_binary
property_value
location_attractiveness_score
```

## 3. Dataset Columns

Map paper variables to project variables:

| Paper variable | Meaning | Project variable | Transform needed |
| --- | --- | --- | --- |
| | | `connectivity` | |
| | | `infrastructure` | |
| | | `builder_reliability` | |
| | | `supply_pressure` | |
| | | `search_heat` | |

## 4. Formula Or ML Algorithm

Capture the paper's model:

```text
model_family:
algorithm:
normalization:
training_split:
evaluation_metrics:
```

For regression, capture:

```text
RMSE:
MAE:
R2:
MAPE:
```

For classification, capture:

```text
accuracy:
precision:
recall:
f1_score:
auc:
```

## 5. Coefficients Or Feature Importance

If the paper gives a formula or coefficients:

```json
{
  "feature_weights": {
    "connectivity": 0,
    "infrastructure": 0,
    "builder_reliability": 0,
    "supply_pressure": 0,
    "search_heat": 0
  },
  "risk_logit_weights": {
    "intercept": 0,
    "supply_pressure": 0,
    "builder_reliability": 0,
    "infrastructure": 0,
    "connectivity": 0,
    "search_heat": 0
  }
}
```

If the paper gives feature importance rather than coefficients, normalize the importances so they sum to `1.0` and place them in `feature_weights`.

## 6. Update Project Config

Edit:

```text
backend/config/model_config.json
```

Set:

```json
{
  "source_status": "base_paper_aligned",
  "model_family": "",
  "score_formula": "",
  "risk_formula": "",
  "normalization": "",
  "feature_ranges": {},
  "feature_weights": {},
  "risk_logit_weights": {},
  "confidence_formula": {},
  "expected_training_columns": [],
  "paper_alignment_note": ""
}
```

## 7. Verification

Run:

```bash
backend\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend/tests'); import test_ml_methodology as t; t.test_minmax_and_inverse_scoring(); t.test_logistic_probability_bounds(); t.test_area_model_outputs_and_metadata(); t.test_methodology_contract(); t.test_model_config_loads_from_json(); t.test_model_audit_contract(); t.test_project_traceability_contract(); print('ml-methodology-tests-ok')"
```

Then verify live after deployment:

```text
/api/model/methodology
/api/model/audit
/api/model/traceability
```
