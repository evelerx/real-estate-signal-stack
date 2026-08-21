from __future__ import annotations

from dataclasses import dataclass


MICRO_MARKETS = [
    {
        "id": "pune_wakad",
        "city": "Pune",
        "micro_market": "Wakad",
        "price_cagr_5y_pct": 9.6,
        "price_cagr_5y_pct_prev": 9.1,
        "rental_yield_trend_bps": 24.0,
        "rental_yield_trend_bps_prev": 16.0,
        "absorption_rate_pct": 25.3,
        "absorption_rate_pct_prev": 24.1,
        "construction_pipeline_units": 8400,
        "construction_pipeline_units_prev": 8860,
        "inventory_months": 13.0,
        "inventory_months_prev": 13.8,
        "employment_growth_pct": 5.4,
        "employment_growth_pct_prev": 5.0,
        "net_migration_k": 167.0,
        "net_migration_k_prev": 160.0,
        "transaction_volume_cr": 92840.0,
        "transaction_volume_cr_prev": 90210.0,
        "cap_rate_trend_bps": -10.0,
        "cap_rate_trend_bps_prev": -6.0,
    },
    {
        "id": "mumbai_thane",
        "city": "Mumbai",
        "micro_market": "Thane West",
        "price_cagr_5y_pct": 8.4,
        "price_cagr_5y_pct_prev": 8.1,
        "rental_yield_trend_bps": 8.0,
        "rental_yield_trend_bps_prev": 12.0,
        "absorption_rate_pct": 22.9,
        "absorption_rate_pct_prev": 23.4,
        "construction_pipeline_units": 12100,
        "construction_pipeline_units_prev": 11640,
        "inventory_months": 16.5,
        "inventory_months_prev": 15.7,
        "employment_growth_pct": 4.3,
        "employment_growth_pct_prev": 4.5,
        "net_migration_k": 129.0,
        "net_migration_k_prev": 133.0,
        "transaction_volume_cr": 121900.0,
        "transaction_volume_cr_prev": 124300.0,
        "cap_rate_trend_bps": 4.0,
        "cap_rate_trend_bps_prev": 0.0,
    },
    {
        "id": "bengaluru_wh",
        "city": "Bengaluru",
        "micro_market": "Whitefield",
        "price_cagr_5y_pct": 10.7,
        "price_cagr_5y_pct_prev": 10.1,
        "rental_yield_trend_bps": 19.0,
        "rental_yield_trend_bps_prev": 14.0,
        "absorption_rate_pct": 27.1,
        "absorption_rate_pct_prev": 25.6,
        "construction_pipeline_units": 9700,
        "construction_pipeline_units_prev": 10120,
        "inventory_months": 10.4,
        "inventory_months_prev": 11.1,
        "employment_growth_pct": 6.0,
        "employment_growth_pct_prev": 5.6,
        "net_migration_k": 181.0,
        "net_migration_k_prev": 172.0,
        "transaction_volume_cr": 109400.0,
        "transaction_volume_cr_prev": 104950.0,
        "cap_rate_trend_bps": -12.0,
        "cap_rate_trend_bps_prev": -8.0,
    },
]

DEVELOPER_INTEL = [
    {
        "developer_id": "dev_lodha",
        "developer_name": "Lodha",
        "city_coverage": ["Mumbai", "Pune", "Bengaluru"],
        "delivery_on_time_pct": 84.0,
        "leverage_ratio": 0.58,
        "litigation_cases_open": 5,
        "capital_stack_transparency_score": 82.0,
    },
    {
        "developer_id": "dev_godrej",
        "developer_name": "Godrej Properties",
        "city_coverage": ["Mumbai", "Pune", "NCR", "Bengaluru"],
        "delivery_on_time_pct": 89.0,
        "leverage_ratio": 0.49,
        "litigation_cases_open": 2,
        "capital_stack_transparency_score": 88.0,
    },
    {
        "developer_id": "dev_prestige",
        "developer_name": "Prestige Group",
        "city_coverage": ["Bengaluru", "Hyderabad", "Chennai"],
        "delivery_on_time_pct": 86.0,
        "leverage_ratio": 0.54,
        "litigation_cases_open": 3,
        "capital_stack_transparency_score": 85.0,
    },
]


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(value, hi))


def _score_components(metrics: dict) -> dict:
    market_score = _clamp(
        18.0
        + metrics["price_cagr_5y_pct"] * 3.6
        + metrics["rental_yield_trend_bps"] * 0.22
        + metrics["absorption_rate_pct"] * 1.5
        + metrics["employment_growth_pct"] * 4.8
        + metrics["net_migration_k"] * 0.07
        + metrics["transaction_volume_cr"] / 2400.0
        - metrics["inventory_months"] * 2.3
        - metrics["construction_pipeline_units"] / 2300.0
        - metrics["cap_rate_trend_bps"] * 0.55,
        0.0,
        100.0,
    )
    supply_pressure = _clamp(
        27.0
        + metrics["construction_pipeline_units"] / 2100.0
        + metrics["inventory_months"] * 2.9
        - metrics["absorption_rate_pct"] * 1.15
        - metrics["rental_yield_trend_bps"] * 0.08,
        0.0,
        100.0,
    )
    liquidity_depth = _clamp(
        14.0
        + metrics["transaction_volume_cr"] / 1750.0
        + metrics["absorption_rate_pct"] * 0.95
        + metrics["net_migration_k"] * 0.05
        - metrics["inventory_months"] * 1.45
        - metrics["cap_rate_trend_bps"] * 0.35,
        0.0,
        100.0,
    )
    demand_momentum = _clamp(
        12.0
        + metrics["price_cagr_5y_pct"] * 2.9
        + metrics["absorption_rate_pct"] * 1.35
        + metrics["employment_growth_pct"] * 5.6
        + metrics["net_migration_k"] * 0.08
        + metrics["rental_yield_trend_bps"] * 0.19
        + metrics["transaction_volume_cr"] / 3000.0
        - metrics["inventory_months"] * 1.2,
        0.0,
        100.0,
    )
    return {
        "market_score": round(market_score, 2),
        "supply_pressure_index": round(supply_pressure, 2),
        "liquidity_depth_index": round(liquidity_depth, 2),
        "demand_momentum_score": round(demand_momentum, 2),
    }


def _metric_trend(current: float, previous: float) -> dict:
    return {
        "current": round(current, 2),
        "previous": round(previous, 2),
        "delta": round(current - previous, 2),
    }


def _market_score(row: dict) -> dict:
    current_inputs = {
        "price_cagr_5y_pct": row["price_cagr_5y_pct"],
        "rental_yield_trend_bps": row["rental_yield_trend_bps"],
        "construction_pipeline_units": row["construction_pipeline_units"],
        "absorption_rate_pct": row["absorption_rate_pct"],
        "inventory_months": row["inventory_months"],
        "employment_growth_pct": row["employment_growth_pct"],
        "net_migration_k": row["net_migration_k"],
        "transaction_volume_cr": row["transaction_volume_cr"],
        "cap_rate_trend_bps": row["cap_rate_trend_bps"],
    }
    previous_inputs = {
        "price_cagr_5y_pct": row["price_cagr_5y_pct_prev"],
        "rental_yield_trend_bps": row["rental_yield_trend_bps_prev"],
        "construction_pipeline_units": row["construction_pipeline_units_prev"],
        "absorption_rate_pct": row["absorption_rate_pct_prev"],
        "inventory_months": row["inventory_months_prev"],
        "employment_growth_pct": row["employment_growth_pct_prev"],
        "net_migration_k": row["net_migration_k_prev"],
        "transaction_volume_cr": row["transaction_volume_cr_prev"],
        "cap_rate_trend_bps": row["cap_rate_trend_bps_prev"],
    }

    current_scores = _score_components(current_inputs)
    previous_scores = _score_components(previous_inputs)
    capital_rotation = _clamp(
        current_scores["market_score"] * 0.5
        + current_scores["liquidity_depth_index"] * 0.45
        - current_scores["supply_pressure_index"] * 0.25,
        0.0,
        100.0,
    )

    return {
        **row,
        **current_scores,
        "micro_market_attractiveness_score": current_scores["market_score"],
        "liquidity_depth_score": current_scores["liquidity_depth_index"],
        "capital_rotation_heat": round(capital_rotation, 2),
        "expansion_compass_inputs": {
            "price_cagr_5y_pct": _metric_trend(current_inputs["price_cagr_5y_pct"], previous_inputs["price_cagr_5y_pct"]),
            "rental_yield_trend_bps": _metric_trend(current_inputs["rental_yield_trend_bps"], previous_inputs["rental_yield_trend_bps"]),
            "units_under_construction": _metric_trend(
                current_inputs["construction_pipeline_units"], previous_inputs["construction_pipeline_units"]
            ),
            "absorption_rate_pct": _metric_trend(current_inputs["absorption_rate_pct"], previous_inputs["absorption_rate_pct"]),
            "months_of_inventory": _metric_trend(current_inputs["inventory_months"], previous_inputs["inventory_months"]),
            "employment_growth_pct": _metric_trend(current_inputs["employment_growth_pct"], previous_inputs["employment_growth_pct"]),
            "net_migration_k": _metric_trend(current_inputs["net_migration_k"], previous_inputs["net_migration_k"]),
            "transaction_volume_cr": _metric_trend(current_inputs["transaction_volume_cr"], previous_inputs["transaction_volume_cr"]),
            "cap_rate_trend_bps": _metric_trend(current_inputs["cap_rate_trend_bps"], previous_inputs["cap_rate_trend_bps"]),
        },
        "expansion_compass_outputs": {
            "market_score": _metric_trend(current_scores["market_score"], previous_scores["market_score"]),
            "supply_pressure_index": _metric_trend(
                current_scores["supply_pressure_index"], previous_scores["supply_pressure_index"]
            ),
            "liquidity_depth_index": _metric_trend(
                current_scores["liquidity_depth_index"], previous_scores["liquidity_depth_index"]
            ),
            "demand_momentum_score": _metric_trend(
                current_scores["demand_momentum_score"], previous_scores["demand_momentum_score"]
            ),
        },
    }


def get_city_intelligence():
    scored = [_market_score(row) for row in MICRO_MARKETS]
    liquidity_ranked = sorted(
        [
            {
                "city": row["city"],
                "micro_market": row["micro_market"],
                "liquidity_depth_score": row["liquidity_depth_score"],
            }
            for row in scored
        ],
        key=lambda x: x["liquidity_depth_score"],
        reverse=True,
    )
    return {
        "micro_markets": scored,
        "liquidity_depth_ranking": liquidity_ranked,
        "capital_rotation_heatmap": [
            {
                "id": row["id"],
                "label": f"{row['city']} - {row['micro_market']}",
                "score": row["capital_rotation_heat"],
            }
            for row in scored
        ],
    }


@dataclass
class AllocationInput:
    target_irr: float
    max_ltv: float
    risk_tolerance: str
    holding_period_years: int
    sector_targets: dict[str, float]
    total_capital_cr: float


def simulate_allocation(payload: AllocationInput) -> dict:
    risk_factor = {"low": 0.82, "medium": 1.0, "high": 1.18}.get(payload.risk_tolerance.lower(), 1.0)
    leverage_factor = _clamp(payload.max_ltv / 65.0, 0.65, 1.25)
    horizon_factor = _clamp(payload.holding_period_years / 6.0, 0.7, 1.25)

    projected_irr = _clamp(payload.target_irr * (0.86 + 0.09 * risk_factor + 0.05 * leverage_factor), 6.0, 26.0)
    risk_adjusted_return = _clamp(projected_irr * (1.06 - (payload.max_ltv / 190.0)), 4.0, 22.0)
    drawdown_exposure = _clamp((payload.max_ltv * 0.45) + (risk_factor * 12.0) - (horizon_factor * 6.0), 4.0, 55.0)
    stress_var_95 = _clamp(drawdown_exposure * 0.85 + (20.0 - projected_irr) * 0.4, 3.0, 40.0)

    allocations = []
    for sector, weight in payload.sector_targets.items():
        normalized = max(0.0, float(weight))
        cap_cr = payload.total_capital_cr * (normalized / 100.0)
        expected_return_pct = _clamp(risk_adjusted_return + (normalized - 30.0) * 0.03, 4.0, 24.0)
        allocations.append(
            {
                "sector": sector,
                "target_weight_pct": round(normalized, 2),
                "capital_allocated_cr": round(cap_cr, 2),
                "expected_return_pct": round(expected_return_pct, 2),
            }
        )

    return {
        "portfolio_construction": allocations,
        "risk_adjusted_return_projection_pct": round(risk_adjusted_return, 2),
        "projected_irr_pct": round(projected_irr, 2),
        "capital_deployment_pacing": {
            "quarter_1_pct": 22,
            "quarter_2_pct": 27,
            "quarter_3_pct": 28,
            "quarter_4_pct": 23,
        },
        "drawdown_exposure_pct": round(drawdown_exposure, 2),
        "stress_scenarios": {
            "base_case_irr_pct": round(projected_irr, 2),
            "mild_stress_irr_pct": round(projected_irr - 1.8, 2),
            "severe_stress_irr_pct": round(projected_irr - 4.6, 2),
            "value_at_risk_95_pct": round(stress_var_95, 2),
        },
    }


@dataclass
class DownsideInput:
    revenue_shock_pct: float
    rate_shock_bps: float
    cap_rate_expansion_bps: float
    liquidity_contraction_pct: float
    base_default_probability_pct: float


def downside_probability(payload: DownsideInput) -> dict:
    impairment = _clamp(
        payload.revenue_shock_pct * 0.43
        + payload.rate_shock_bps * 0.015
        + payload.cap_rate_expansion_bps * 0.017
        + payload.liquidity_contraction_pct * 0.34
        + payload.base_default_probability_pct * 0.62,
        1.0,
        95.0,
    )
    worst_case_loss = _clamp(impairment * 0.86 + payload.cap_rate_expansion_bps * 0.02, 2.0, 98.0)
    survival = _clamp(100.0 - impairment * 0.92, 0.0, 99.0)
    expected_default = _clamp(
        payload.base_default_probability_pct * (1.0 + payload.liquidity_contraction_pct / 180.0 + payload.rate_shock_bps / 2400.0),
        0.1,
        99.0,
    )
    return {
        "equity_impairment_probability_pct": round(impairment, 2),
        "worst_case_loss_band_pct": {
            "p50": round(worst_case_loss * 0.72, 2),
            "p75": round(worst_case_loss * 0.9, 2),
            "p95": round(worst_case_loss, 2),
        },
        "survival_probability_score": round(survival, 2),
        "default_probability_estimate_pct": round(expected_default, 2),
    }


def get_developer_intelligence() -> dict:
    output = []
    for row in DEVELOPER_INTEL:
        leverage_penalty = row["leverage_ratio"] * 40.0
        litigation_penalty = row["litigation_cases_open"] * 2.8
        delivery_support = row["delivery_on_time_pct"] * 0.68
        transparency_support = row["capital_stack_transparency_score"] * 0.46

        risk_score = _clamp(100.0 - leverage_penalty - litigation_penalty + delivery_support + transparency_support - 30.0, 0.0, 100.0)
        output.append(
            {
                **row,
                "developer_risk_index": round(risk_score, 2),
                "risk_band": "low" if risk_score >= 72 else "medium" if risk_score >= 48 else "high",
            }
        )
    output.sort(key=lambda x: x["developer_risk_index"], reverse=True)
    return {"developers": output}


def generate_ic_memo(
    deal_name: str,
    city: str,
    micro_market: str,
    target_equity_cr: float,
    scenario: dict,
) -> dict:
    headline = f"{deal_name}: {city}/{micro_market} allocation memo"
    investment_thesis = (
        f"Deploy {target_equity_cr:.2f} Cr in {micro_market}, {city}. "
        "Primary alpha drivers: demand depth, pricing resilience, and institutional participation."
    )
    downside = (
        f"Modeled impairment probability is {scenario['equity_impairment_probability_pct']}% "
        f"with p95 loss at {scenario['worst_case_loss_band_pct']['p95']}%."
    )
    recommendation = (
        "Proceed with staged deployment and quarterly risk gates."
        if scenario["survival_probability_score"] >= 60
        else "Hold deployment; downside protection insufficient under current scenario."
    )

    return {
        "memo_title": headline,
        "sections": {
            "investment_thesis": investment_thesis,
            "risk_summary": downside,
            "capital_strategy": recommendation,
        },
        "model_version": "enterprise-v1",
        "audit_trail": {
            "status": "generated",
            "steps": [
                "market_intelligence_snapshot",
                "allocation_simulation",
                "downside_probability_model",
                "ic_memo_compilation",
            ],
        },
    }


def get_macro_credit_overview() -> dict:
    interest_rates = {
        "policy_rate_pct": 6.5,
        "home_loan_rate_pct": 8.75,
        "commercial_loan_rate_pct": 10.9,
    }
    loan_penetration_ratio_pct = {
        "loan_financed": 68,
        "one_time_payment": 32,
    }
    local_project_launch_pipeline = [
        {"period": "2025-Q1", "launched": 612, "permitted": 642, "pipeline_units": 21420},
        {"period": "2025-Q2", "launched": 648, "permitted": 676, "pipeline_units": 22310},
        {"period": "2025-Q3", "launched": 691, "permitted": 719, "pipeline_units": 23180},
        {"period": "2025-Q4", "launched": 719, "permitted": 748, "pipeline_units": 23810},
        {"period": "2026-Q1", "launched": 744, "permitted": 773, "pipeline_units": 24620},
    ]
    absorption_rate_pct = [
        {"period": "2025-Q1", "value": 22.4},
        {"period": "2025-Q2", "value": 23.1},
        {"period": "2025-Q3", "value": 23.8},
        {"period": "2025-Q4", "value": 24.6},
        {"period": "2026-Q1", "value": 25.1},
    ]
    migration_employment_growth = [
        {"period": "2025-Q1", "net_migration_k": 142, "employment_growth_pct": 4.6},
        {"period": "2025-Q2", "net_migration_k": 148, "employment_growth_pct": 4.9},
        {"period": "2025-Q3", "net_migration_k": 153, "employment_growth_pct": 5.1},
        {"period": "2025-Q4", "net_migration_k": 160, "employment_growth_pct": 5.3},
        {"period": "2026-Q1", "net_migration_k": 167, "employment_growth_pct": 5.5},
    ]
    transaction_volume_cr = [
        {"period": "2025-Q1", "value": 81400},
        {"period": "2025-Q2", "value": 83950},
        {"period": "2025-Q3", "value": 86820},
        {"period": "2025-Q4", "value": 90210},
        {"period": "2026-Q1", "value": 92840},
    ]
    cap_rate_trend_pct = [
        {"period": "2025-Q1", "value": 6.4},
        {"period": "2025-Q2", "value": 6.3},
        {"period": "2025-Q3", "value": 6.2},
        {"period": "2025-Q4", "value": 6.1},
        {"period": "2026-Q1", "value": 6.0},
    ]
    home_loan_rate_history_pct = [
        {"month": "2023-03", "rate": 8.45},
        {"month": "2023-06", "rate": 8.65},
        {"month": "2023-09", "rate": 8.85},
        {"month": "2023-12", "rate": 9.05},
        {"month": "2024-03", "rate": 8.95},
        {"month": "2024-06", "rate": 8.85},
        {"month": "2024-09", "rate": 8.80},
        {"month": "2024-12", "rate": 8.70},
        {"month": "2025-03", "rate": 8.80},
        {"month": "2025-06", "rate": 8.90},
        {"month": "2025-09", "rate": 8.85},
        {"month": "2025-12", "rate": 8.80},
        {"month": "2026-02", "rate": 8.75},
    ]

    # Optional recession inputs
    gdp_trend_projection_pct = [
        {"year": 2024, "value": 6.7},
        {"year": 2025, "value": 6.5},
        {"year": 2026, "value": 6.3},
        {"year": 2027, "value": 6.4},
    ]
    city_fdi_inflow_usd_b = [
        {"city": "Mumbai", "value": 15.8},
        {"city": "Bengaluru", "value": 12.6},
        {"city": "Delhi NCR", "value": 11.2},
        {"city": "Hyderabad", "value": 8.4},
        {"city": "Pune", "value": 6.9},
    ]

    latest_absorption = absorption_rate_pct[-1]["value"]
    latest_txn = transaction_volume_cr[-1]["value"]
    latest_migration = migration_employment_growth[-1]["net_migration_k"]
    latest_employment = migration_employment_growth[-1]["employment_growth_pct"]
    latest_cap_rate = cap_rate_trend_pct[-1]["value"]

    macro_risk_score = _clamp(
        (interest_rates["policy_rate_pct"] * 5.1)
        + (interest_rates["commercial_loan_rate_pct"] * 2.8)
        + (100 - latest_absorption) * 0.21
        + (6.8 - gdp_trend_projection_pct[2]["value"]) * 14.0,
        0.0,
        100.0,
    )
    rate_sensitivity_index = _clamp(
        (interest_rates["home_loan_rate_pct"] - 7.0) * 17.0
        + (interest_rates["commercial_loan_rate_pct"] - 8.0) * 8.5
        + loan_penetration_ratio_pct["loan_financed"] * 0.28,
        0.0,
        100.0,
    )
    demand_momentum_score = _clamp(
        latest_absorption * 1.9
        + latest_employment * 4.2
        + (latest_migration / 10.0)
        + (latest_txn / 10000.0) * 3.0
        - interest_rates["home_loan_rate_pct"] * 3.5,
        0.0,
        100.0,
    )
    liquidity_tightening_signal = _clamp(
        (interest_rates["commercial_loan_rate_pct"] * 4.3)
        + (100 - loan_penetration_ratio_pct["loan_financed"]) * 0.9
        + latest_cap_rate * 3.2
        - (latest_txn / 10000.0) * 4.5,
        0.0,
        100.0,
    )

    return {
        "as_of": "2026-02-18",
        "interest_rates": interest_rates,
        "loan_penetration_ratio_pct": loan_penetration_ratio_pct,
        "local_project_launch_pipeline": local_project_launch_pipeline,
        "absorption_rate_pct": absorption_rate_pct,
        "migration_employment_growth": migration_employment_growth,
        "transaction_volume_cr": transaction_volume_cr,
        "cap_rate_trend_pct": cap_rate_trend_pct,
        "home_loan_rate_history_pct": home_loan_rate_history_pct,
        "gdp_trend_projection_pct": gdp_trend_projection_pct,
        "city_fdi_inflow_usd_b": city_fdi_inflow_usd_b,
        "derived_signals": {
            "macro_risk_score": round(macro_risk_score, 2),
            "rate_sensitivity_index": round(rate_sensitivity_index, 2),
            "demand_momentum_score": round(demand_momentum_score, 2),
            "liquidity_tightening_signal": round(liquidity_tightening_signal, 2),
        },
    }
