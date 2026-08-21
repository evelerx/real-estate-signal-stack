# Real Estate Signal Stack - Model Methodology

This project implements a real-estate intelligence workflow for comparing micro-markets, scoring capital allocation opportunities, and explaining the risk behind each score.

The active model is aligned to the project base paper: **Real Estate Investment Choices and Decision Support Systems** by Vincenzo Del Giudice, Pierfrancesco De Paola, Torrieri Francesca, Peter J. Nijkamp, and Aviad Shapira, published in Sustainability 2019, 11, 3110.

The paper proposes a decision support system for real-estate investment choices using Analytic Hierarchy Process (AHP), a stated preference experiment, and multinomial logit calibration. The project maps that framework to live dashboard indicators: normalize market indicators, compute an AHP-weighted attractiveness score, estimate risk probability with a logistic model, and expose every coefficient for review.

## Model Inputs

The area scoring model currently uses these inputs:

| Feature | Meaning | Direction |
| --- | --- | --- |
| `connectivity` | Paper accessibility attribute, represented as road/transit/access quality | Higher is better |
| `infrastructure` | Paper environmental quality attribute, represented as infrastructure and place quality | Higher is better |
| `builder_reliability` | Paper socioeconomic context attribute, used as execution/social context confidence proxy | Higher is better |
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
connectivity         = 0.153775
infrastructure       = 0.304988
builder_reliability  = 0.269308
supply_pressure      = 0.100000
search_heat          = 0.082376
```

The backend exposes these weights at:

```text
/api/model/methodology
```

The backend also exposes a model contract audit at:

```text
/api/model/audit
```

This audit checks whether the active area dataset contains the required model features and whether computed score, risk, and confidence outputs stay inside valid ranges.

The synopsis-to-implementation traceability map is exposed at:

```text
/api/model/traceability
```

It maps the project problem statement, ML scoring, risk/confidence outputs, and base-paper alignment work to the files and live API endpoints that prove each part exists.

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
  - builder_reliability * 0.0147
  - infrastructure * 0.0148
  - connectivity * 0.00426
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
  - abs(admin_override_delta) * 28
  - risk_deduction * 0.45
  - risk_probability * 0.16
```

The final value is clamped to the 0-100 range.

## ML Upgrade Path

When labelled historical Indian micro-market data is available, the paper-backed model can be upgraded to:

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

The filled base-paper mapping is stored at:

```text
backend/config/base_paper_mapping.filled.json
```

It records paper identity, variable mapping, AHP weights, stated-preference design details, and multinomial-logit coefficients. To regenerate a draft config from that mapping, run:

```text
backend\venv\Scripts\python.exe backend\tools\generate_model_config_from_mapping.py backend\config\base_paper_mapping.filled.json --output backend\config\model_config.generated.json
```

The production model loader reads `backend/config/model_config.json` at runtime and exposes it through the API and report UI.
