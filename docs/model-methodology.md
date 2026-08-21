# Real Estate Signal Stack - Model Methodology

This project implements a real-estate intelligence workflow for comparing micro-markets, scoring capital allocation opportunities, and explaining the risk behind each score.

The current repository does not include the referenced synopsis or base paper file. Until that paper is added, the implementation uses a transparent hybrid model that follows the same structure commonly used in real-estate intelligence research: normalize market indicators, compute a weighted opportunity score, estimate risk probability with a logistic model, and expose every coefficient for review.

## Model Inputs

The area scoring model currently uses these inputs:

| Feature | Meaning | Direction |
| --- | --- | --- |
| `connectivity` | Road/transit/access quality | Higher is better |
| `infrastructure` | Infrastructure pipeline and civic readiness | Higher is better |
| `builder_reliability` | Developer execution quality | Higher is better |
| `supply_pressure` | Oversupply and inventory stress | Lower is better |
| `search_heat` | Demand/search interest proxy | Higher is better |

All inputs are normalized to a 0-100 scale. `supply_pressure` is inverse-scored because high oversupply reduces opportunity.

## Capital Allocation Score

The opportunity model is:

```text
score = weighted_sum(minmax_normalized_features) * final_adjustment_factor - risk_deduction
```

Current feature weights:

```text
connectivity         = 0.25
infrastructure       = 0.20
builder_reliability  = 0.20
supply_pressure      = 0.20
search_heat          = 0.15
```

The backend exposes these weights at:

```text
/api/model/methodology
```

Each area snapshot also includes the active model metadata in:

```text
score_composition.model_formula
```

## Risk Probability

Risk probability uses a logistic function:

```text
P(risk) = 1 / (1 + e^-z)
```

Where:

```text
z =
  intercept
  + supply_pressure * 0.030
  - builder_reliability * 0.026
  - infrastructure * 0.014
  - connectivity * 0.012
  - search_heat * 0.006
```

The current intercept is `-2.10`.

This produces `risk_probability_pct`, which is returned in every area snapshot.

## Confidence Score

The confidence score rewards stronger data quality and penalizes uncertainty:

```text
confidence =
  72
  + builder_reliability_normalized * 0.12
  + connectivity_normalized * 0.08
  - abs(analyst_delta) * 28
  - risk_deduction * 0.45
  - risk_probability * 0.16
```

The final value is clamped to the 0-100 range.

## ML Upgrade Path

When labelled historical data is available, the current transparent model can be upgraded to:

| Target | Recommended model |
| --- | --- |
| Price growth / ROI prediction | Random Forest, Gradient Boosting, or XGBoost regression |
| Risk / bad-investment classification | Logistic Regression, Random Forest Classifier, or XGBoost Classifier |
| Feature importance | Tree-based feature importance or SHAP |
| Confidence intervals | Quantile regression or bootstrapped model ensembles |

Recommended training columns:

```text
connectivity
infrastructure
builder_reliability
supply_pressure
search_heat
price_growth
absorption_rate
inventory_months
rental_yield
```

## Base Paper Alignment

Once the base paper is added to the repo, update:

```text
backend/services/ml_methodology.py
```

Replace:

```text
AREA_SCORE_WEIGHTS
RISK_LOGIT_WEIGHTS
AREA_FEATURE_RANGES
```

with the exact variables, formulas, coefficients, and model choice from the paper. The API and report UI already expose this metadata, so the frontend will automatically reflect the paper-backed model.
