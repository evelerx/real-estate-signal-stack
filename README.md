# Real Estate Signal Stack

Final-year major project for real-estate market intelligence, micro-market comparison, capital allocation scoring, and risk-aware dashboarding.

Live deployment:

```text
https://real-estate-signal-stack.vercel.app
```

## Problem Statement

Students, analysts, and small investors often compare real-estate locations using scattered signals: infrastructure news, developer reputation, online demand, price movement, supply pipeline, and local liquidity. These signals are hard to compare consistently, and decisions can become subjective.

This project solves that by converting local market indicators into structured scores, risk probabilities, confidence bands, heatmaps, and explainable reports.

## Proposed Solution

The website acts as a real-estate intelligence stack:

- Collect area, city, developer, demand, supply, and live API signals.
- Normalize market indicators into comparable 0-100 values.
- Calculate capital allocation opportunity scores.
- Estimate downside risk using a logistic risk model.
- Display explainable reports, dashboards, heatmaps, and data sheets.
- Allow Admin-only workflow control without the old CEO/Data Analyst hierarchy.

## Core Modules

| Module | Purpose |
| --- | --- |
| Public introduction | Explains project purpose, real-life problem, and solution flow |
| Admin portal | Single Admin access for live API keys, OpenRouter key, and data workflows |
| Area analysis | Shows score, confidence, risk, trend charts, and downloadable report |
| Heatmap | Compares area-level opportunity scores visually |
| Investor dashboard | Portfolio and market intelligence view |
| Enterprise workbench | Allocation simulation, downside modeling, and memo generation |
| Model methodology API | Exposes formulas, weights, and expected ML upgrade path |

## Machine Learning And Formula Layer

The active backend model is a transparent hybrid ML-style scoring layer. It is intentionally explainable for final-year evaluation and can be replaced with exact coefficients from the base paper once that file is added.

Current model documentation:

```text
docs/model-methodology.md
```

Live methodology endpoint:

```text
/api/model/methodology
```

Live synopsis traceability endpoint:

```text
/api/model/traceability
```

Area snapshots include model metadata:

```text
/api/areas/wakad
```

Important returned fields:

```text
score_composition.ml_adjusted_area_score
score_composition.risk_probability_pct
score_composition.ml_confidence_score
score_composition.normalized_features
score_composition.model_formula
```

## Current Formula Summary

Capital allocation score:

```text
score = weighted_sum(minmax_normalized_features) * final_adjustment_factor - risk_deduction
```

Risk probability:

```text
P(risk) = 1 / (1 + e^-z)
```

Confidence:

```text
confidence =
  72
  + builder_reliability_normalized * 0.12
  + connectivity_normalized * 0.08
  - abs(analyst_delta) * 28
  - risk_deduction * 0.45
  - risk_probability * 0.16
```

## Base Paper Alignment Status

The referenced synopsis/base paper is not currently present in this repository. The project is prepared for paper alignment through:

```text
backend/config/model_config.json
```

Base-paper extraction guide:

```text
docs/base-paper-extraction-template.md
backend/config/base_paper_mapping.template.json
```

When the paper is added, update:

```text
feature_weights
risk_logit_weights
feature_ranges
```

The backend API and frontend reports already expose those values automatically.

## Local Development

Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev
```

Run frontend production build:

```bash
cd frontend
npm run build
```

Run backend checks:

```bash
backend\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend/tests'); import test_ml_methodology as t; t.test_minmax_and_inverse_scoring(); t.test_logistic_probability_bounds(); t.test_area_model_outputs_and_metadata(); t.test_methodology_contract(); print('ml-methodology-tests-ok')"
```

## Deployment

The project is deployed on Vercel. Production is served from:

```text
https://real-estate-signal-stack.vercel.app
```

## Notes For Evaluation

- The system is not only a static website; it includes backend scoring APIs.
- The model formulas are visible in both documentation and live API output.
- Live data polling is designed to run only while chart/heatmap views are open.
- OpenRouter support is available for future AI-assisted analysis with a local usage cap.
