import json
import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from models.intel_entry import IntelEntry
from schemas.intel import (
    CityIntelligenceInput,
    DealSurvivalInput,
    DeveloperIntelligenceInput,
    IntelPayload,
    MicroMarketInput,
)
from services.db import get_db
from services.rbac import require_roles

ALLOWED_ROLES = ["ceo", "data_analyst", "general", "subscriptionowner"]
ALLOWED_EDITOR_ROLES = ["ceo", "data_analyst"]
ALLOWED_MANUAL_INPUT_ROLES = ["ceo", "data_analyst", "general"]

router = APIRouter(prefix="/internal/intel", tags=["Intel Inputs"])

_CITY_INTELLIGENCE_STORE: dict[str, dict] = {
    "mumbai": {
        "city": "Mumbai",
        "employment_growth_services_pct": 6.1,
        "employment_growth_manufacturing_pct": 4.2,
        "office_absorption_msf": 12.8,
        "it_expansion_index": 72.0,
        "manufacturing_expansion_index": 55.0,
        "migration_inflow_k": 181.0,
        "infrastructure_project_index": 78.0,
        "residential_price_cagr_5y_pct": 8.7,
        "residential_price_cagr_10y_pct": 7.1,
        "rental_yield_pct": 3.0,
        "rental_yield_trend_bps": 12.0,
        "transaction_volume_cr": 142000.0,
        "units_under_construction": 255000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "pune": {
        "city": "Pune",
        "employment_growth_services_pct": 7.0,
        "employment_growth_manufacturing_pct": 5.4,
        "office_absorption_msf": 8.7,
        "it_expansion_index": 82.0,
        "manufacturing_expansion_index": 69.0,
        "migration_inflow_k": 139.0,
        "infrastructure_project_index": 73.0,
        "residential_price_cagr_5y_pct": 9.3,
        "residential_price_cagr_10y_pct": 8.0,
        "rental_yield_pct": 3.4,
        "rental_yield_trend_bps": 18.0,
        "transaction_volume_cr": 92840.0,
        "units_under_construction": 132000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "bengaluru": {
        "city": "Bengaluru",
        "employment_growth_services_pct": 7.4,
        "employment_growth_manufacturing_pct": 4.1,
        "office_absorption_msf": 14.2,
        "it_expansion_index": 88.0,
        "manufacturing_expansion_index": 57.0,
        "migration_inflow_k": 205.0,
        "infrastructure_project_index": 76.0,
        "residential_price_cagr_5y_pct": 10.4,
        "residential_price_cagr_10y_pct": 8.6,
        "rental_yield_pct": 3.6,
        "rental_yield_trend_bps": 21.0,
        "transaction_volume_cr": 116500.0,
        "units_under_construction": 176000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "hyderabad": {
        "city": "Hyderabad",
        "employment_growth_services_pct": 6.8,
        "employment_growth_manufacturing_pct": 5.0,
        "office_absorption_msf": 10.6,
        "it_expansion_index": 79.0,
        "manufacturing_expansion_index": 63.0,
        "migration_inflow_k": 162.0,
        "infrastructure_project_index": 75.0,
        "residential_price_cagr_5y_pct": 9.7,
        "residential_price_cagr_10y_pct": 8.3,
        "rental_yield_pct": 3.8,
        "rental_yield_trend_bps": 19.0,
        "transaction_volume_cr": 102300.0,
        "units_under_construction": 149000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "ncr": {
        "city": "NCR",
        "employment_growth_services_pct": 5.7,
        "employment_growth_manufacturing_pct": 4.9,
        "office_absorption_msf": 11.4,
        "it_expansion_index": 70.0,
        "manufacturing_expansion_index": 67.0,
        "migration_inflow_k": 191.0,
        "infrastructure_project_index": 81.0,
        "residential_price_cagr_5y_pct": 8.1,
        "residential_price_cagr_10y_pct": 6.9,
        "rental_yield_pct": 3.1,
        "rental_yield_trend_bps": 11.0,
        "transaction_volume_cr": 128400.0,
        "units_under_construction": 268000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "chennai": {
        "city": "Chennai",
        "employment_growth_services_pct": 5.9,
        "employment_growth_manufacturing_pct": 5.8,
        "office_absorption_msf": 7.1,
        "it_expansion_index": 67.0,
        "manufacturing_expansion_index": 74.0,
        "migration_inflow_k": 117.0,
        "infrastructure_project_index": 71.0,
        "residential_price_cagr_5y_pct": 7.8,
        "residential_price_cagr_10y_pct": 6.8,
        "rental_yield_pct": 3.9,
        "rental_yield_trend_bps": 9.0,
        "transaction_volume_cr": 81500.0,
        "units_under_construction": 98000.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
}

_MICRO_MARKET_STORE: dict[str, dict] = {
    "mumbai:bkc": {
        "city": "Mumbai",
        "micro_market": "BKC",
        "price_psf_3y_ago": 29800.0,
        "price_psf_2y_ago": 31700.0,
        "price_psf_1y_ago": 34100.0,
        "price_psf_current": 36600.0,
        "rental_yield_pct": 3.0,
        "units_under_construction": 12800.0,
        "months_of_inventory": 14.0,
        "absorption_rate_pct": 24.5,
        "developer_concentration_pct": 62.0,
        "land_price_movement_3y_pct": 19.0,
        "transaction_depth_index": 81.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "pune:wakad": {
        "city": "Pune",
        "micro_market": "Wakad",
        "price_psf_3y_ago": 7300.0,
        "price_psf_2y_ago": 7950.0,
        "price_psf_1y_ago": 8620.0,
        "price_psf_current": 9350.0,
        "rental_yield_pct": 3.6,
        "units_under_construction": 9800.0,
        "months_of_inventory": 11.5,
        "absorption_rate_pct": 27.1,
        "developer_concentration_pct": 44.0,
        "land_price_movement_3y_pct": 22.0,
        "transaction_depth_index": 76.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "bengaluru:whitefield": {
        "city": "Bengaluru",
        "micro_market": "Whitefield",
        "price_psf_3y_ago": 8400.0,
        "price_psf_2y_ago": 9150.0,
        "price_psf_1y_ago": 10100.0,
        "price_psf_current": 11350.0,
        "rental_yield_pct": 3.9,
        "units_under_construction": 12200.0,
        "months_of_inventory": 10.1,
        "absorption_rate_pct": 28.4,
        "developer_concentration_pct": 39.0,
        "land_price_movement_3y_pct": 24.0,
        "transaction_depth_index": 83.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "hyderabad:gachibowli": {
        "city": "Hyderabad",
        "micro_market": "Gachibowli",
        "price_psf_3y_ago": 6900.0,
        "price_psf_2y_ago": 7650.0,
        "price_psf_1y_ago": 8410.0,
        "price_psf_current": 9240.0,
        "rental_yield_pct": 4.0,
        "units_under_construction": 10800.0,
        "months_of_inventory": 10.8,
        "absorption_rate_pct": 26.8,
        "developer_concentration_pct": 41.0,
        "land_price_movement_3y_pct": 21.0,
        "transaction_depth_index": 78.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "ncr:gurugram-golf-course-road": {
        "city": "NCR",
        "micro_market": "Gurugram Golf Course Road",
        "price_psf_3y_ago": 12600.0,
        "price_psf_2y_ago": 13900.0,
        "price_psf_1y_ago": 15600.0,
        "price_psf_current": 17500.0,
        "rental_yield_pct": 3.2,
        "units_under_construction": 15200.0,
        "months_of_inventory": 15.6,
        "absorption_rate_pct": 22.9,
        "developer_concentration_pct": 66.0,
        "land_price_movement_3y_pct": 17.0,
        "transaction_depth_index": 75.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
    "chennai:omr": {
        "city": "Chennai",
        "micro_market": "OMR",
        "price_psf_3y_ago": 6100.0,
        "price_psf_2y_ago": 6580.0,
        "price_psf_1y_ago": 7060.0,
        "price_psf_current": 7610.0,
        "rental_yield_pct": 4.2,
        "units_under_construction": 8200.0,
        "months_of_inventory": 12.2,
        "absorption_rate_pct": 23.4,
        "developer_concentration_pct": 48.0,
        "land_price_movement_3y_pct": 14.0,
        "transaction_depth_index": 69.0,
        "updatedAt": "2026-02-20T00:00:00Z",
    },
}

_DEVELOPER_INTELLIGENCE_STORE: dict[str, dict] = {
    "godrej_properties": {
        "developer_name": "Godrej Properties",
        "api_delivery_delay_pct": 11.2,
        "api_past_litigation_cases": 2.0,
        "api_rera_compliance_score": 89.0,
        "api_project_completion_ratio_pct": 87.0,
        "manual_balance_sheet_leverage_ratio": 0.49,
        "manual_past_investor_outcome_score": 83.0,
        "updatedAt": "2026-02-22T00:00:00Z",
    },
    "lodha": {
        "developer_name": "Lodha",
        "api_delivery_delay_pct": 16.8,
        "api_past_litigation_cases": 5.0,
        "api_rera_compliance_score": 78.0,
        "api_project_completion_ratio_pct": 81.0,
        "manual_balance_sheet_leverage_ratio": 0.58,
        "manual_past_investor_outcome_score": 72.0,
        "updatedAt": "2026-02-22T00:00:00Z",
    },
    "prestige_group": {
        "developer_name": "Prestige Group",
        "api_delivery_delay_pct": 13.6,
        "api_past_litigation_cases": 3.0,
        "api_rera_compliance_score": 84.0,
        "api_project_completion_ratio_pct": 85.0,
        "manual_balance_sheet_leverage_ratio": 0.54,
        "manual_past_investor_outcome_score": 79.0,
        "updatedAt": "2026-02-22T00:00:00Z",
    },
    "sobha": {
        "developer_name": "Sobha",
        "api_delivery_delay_pct": 9.4,
        "api_past_litigation_cases": 1.0,
        "api_rera_compliance_score": 91.0,
        "api_project_completion_ratio_pct": 90.0,
        "manual_balance_sheet_leverage_ratio": 0.41,
        "manual_past_investor_outcome_score": 88.0,
        "updatedAt": "2026-02-22T00:00:00Z",
    },
}

_DEAL_SURVIVAL_STORE: dict[str, dict] = {
    "pune-wakad-rental-income-fund": {
        "deal_name": "Pune Wakad Rental Income Fund",
        "api_purchase_price_cr": 215.0,
        "api_replacement_cost_cr": 238.0,
        "api_ltv_pct": 57.0,
        "api_dscr": 1.43,
        "api_break_even_occupancy_pct": 63.0,
        "api_revenue_stress_10_pct": -9.4,
        "api_revenue_stress_15_pct": -13.8,
        "api_exit_cap_stress_bps": 55.0,
        "manual_purchase_price_cr": 215.0,
        "manual_replacement_cost_cr": 238.0,
        "manual_ltv_pct": 57.0,
        "manual_dscr": 1.43,
        "manual_break_even_occupancy_pct": 63.0,
        "manual_revenue_stress_10_pct": -9.4,
        "manual_revenue_stress_15_pct": -13.8,
        "manual_exit_cap_stress_bps": 55.0,
        "updatedAt": "2026-02-23T00:00:00Z",
    },
    "mumbai-bkc-grade-a-office-core": {
        "deal_name": "Mumbai BKC Grade A Office Core",
        "api_purchase_price_cr": 640.0,
        "api_replacement_cost_cr": 675.0,
        "api_ltv_pct": 61.0,
        "api_dscr": 1.29,
        "api_break_even_occupancy_pct": 70.0,
        "api_revenue_stress_10_pct": -11.1,
        "api_revenue_stress_15_pct": -16.2,
        "api_exit_cap_stress_bps": 60.0,
        "manual_purchase_price_cr": 640.0,
        "manual_replacement_cost_cr": 675.0,
        "manual_ltv_pct": 61.0,
        "manual_dscr": 1.29,
        "manual_break_even_occupancy_pct": 70.0,
        "manual_revenue_stress_10_pct": -11.1,
        "manual_revenue_stress_15_pct": -16.2,
        "manual_exit_cap_stress_bps": 60.0,
        "updatedAt": "2026-02-23T00:00:00Z",
    },
    "hyderabad-gachibowli-flex-campus": {
        "deal_name": "Hyderabad Gachibowli Flex Campus",
        "api_purchase_price_cr": 172.0,
        "api_replacement_cost_cr": 188.0,
        "api_ltv_pct": 54.0,
        "api_dscr": 1.55,
        "api_break_even_occupancy_pct": 59.0,
        "api_revenue_stress_10_pct": -8.2,
        "api_revenue_stress_15_pct": -12.1,
        "api_exit_cap_stress_bps": 50.0,
        "manual_purchase_price_cr": 172.0,
        "manual_replacement_cost_cr": 188.0,
        "manual_ltv_pct": 54.0,
        "manual_dscr": 1.55,
        "manual_break_even_occupancy_pct": 59.0,
        "manual_revenue_stress_10_pct": -8.2,
        "manual_revenue_stress_15_pct": -12.1,
        "manual_exit_cap_stress_bps": 50.0,
        "updatedAt": "2026-02-23T00:00:00Z",
    },
}


def _normalize_area(area: str) -> str:
    return area.strip().lower()


def _safe_load(raw: str | None) -> list:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return value if isinstance(value, list) else []


def _to_payload(entry: IntelEntry | None) -> IntelPayload:
    if not entry:
        return IntelPayload()
    return IntelPayload(
        listings=_safe_load(entry.listings_json),
        brokerDeals=_safe_load(entry.broker_deals_json),
        validations=_safe_load(entry.validations_json),
    )


def _normalize_str(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(value, hi))


def _to_city_key(value: str) -> str:
    return _normalize_str(value).lower().replace(" ", "_")


def _supply_risk_band(value: float) -> str:
    if value >= 70:
        return "high"
    if value >= 45:
        return "medium"
    return "low"


def _compute_city_rankings() -> list[dict]:
    rows = [dict(v) for v in _CITY_INTELLIGENCE_STORE.values()]
    scored: list[dict] = []
    for row in rows:
        transaction_scale = row["transaction_volume_cr"] / 10000.0
        supply_pressure = _clamp(
            (row["units_under_construction"] / 3000.0)
            - row["office_absorption_msf"] * 1.9
            - row["rental_yield_trend_bps"] * 0.35
            + (10.0 - row["residential_price_cagr_5y_pct"]) * 1.6,
            0.0,
            100.0,
        )
        attractiveness = _clamp(
            row["employment_growth_services_pct"] * 4.6
            + row["employment_growth_manufacturing_pct"] * 3.7
            + row["office_absorption_msf"] * 1.85
            + row["it_expansion_index"] * 0.18
            + row["manufacturing_expansion_index"] * 0.14
            + row["migration_inflow_k"] * 0.09
            + row["infrastructure_project_index"] * 0.16
            + row["residential_price_cagr_5y_pct"] * 1.6
            + row["residential_price_cagr_10y_pct"] * 0.8
            + row["rental_yield_pct"] * 2.2
            + row["rental_yield_trend_bps"] * 0.2
            + transaction_scale * 2.6
            - supply_pressure * 0.22,
            0.0,
            100.0,
        )
        rotation_score = _clamp(
            attractiveness * 0.65
            + row["office_absorption_msf"] * 1.4
            + transaction_scale * 2.4
            + row["rental_yield_trend_bps"] * 0.2
            - supply_pressure * 0.4,
            0.0,
            100.0,
        )
        scored.append(
            {
                **row,
                "city_attractiveness_score": round(attractiveness, 2),
                "capital_rotation_score": round(rotation_score, 2),
                "supply_risk_score": round(supply_pressure, 2),
                "supply_risk_band": _supply_risk_band(supply_pressure),
            }
        )

    scored.sort(key=lambda x: (x["capital_rotation_score"], x["city_attractiveness_score"]), reverse=True)
    for idx, row in enumerate(scored, start=1):
        row["capital_rotation_ranking"] = idx
    return scored


def _to_micro_key(city: str, micro_market: str) -> str:
    return f"{_to_city_key(city)}:{_to_city_key(micro_market)}"


def _compute_micro_market_scores() -> list[dict]:
    scored: list[dict] = []
    for row in _MICRO_MARKET_STORE.values():
        price_growth_3y_pct = 0.0
        if row["price_psf_3y_ago"] > 0:
            price_growth_3y_pct = ((row["price_psf_current"] / row["price_psf_3y_ago"]) - 1.0) * 100.0

        fair_growth_anchor = (
            row["land_price_movement_3y_pct"] * 0.55
            + row["rental_yield_pct"] * 4.5
            + row["absorption_rate_pct"] * 0.32
        )
        mispricing_index = _clamp(
            (price_growth_3y_pct - fair_growth_anchor) * 1.2
            + (row["developer_concentration_pct"] - 45.0) * 0.28,
            -100.0,
            100.0,
        )

        demand_momentum_score = _clamp(
            row["absorption_rate_pct"] * 2.1
            + row["rental_yield_pct"] * 6.5
            + row["transaction_depth_index"] * 0.38
            + (price_growth_3y_pct / 3.0)
            - row["months_of_inventory"] * 1.9,
            0.0,
            100.0,
        )

        oversupply_risk = _clamp(
            (row["units_under_construction"] / 450.0)
            + row["months_of_inventory"] * 2.4
            + row["developer_concentration_pct"] * 0.35
            - row["absorption_rate_pct"] * 1.2,
            0.0,
            100.0,
        )

        liquidity_depth_score = _clamp(
            row["transaction_depth_index"] * 0.62
            + row["absorption_rate_pct"] * 1.35
            + row["rental_yield_pct"] * 4.2
            - row["months_of_inventory"] * 1.1
            - oversupply_risk * 0.22,
            0.0,
            100.0,
        )

        scored.append(
            {
                **row,
                "price_growth_3y_pct": round(price_growth_3y_pct, 2),
                "mispricing_index": round(mispricing_index, 2),
                "demand_momentum_score": round(demand_momentum_score, 2),
                "oversupply_risk": round(oversupply_risk, 2),
                "liquidity_depth_score": round(liquidity_depth_score, 2),
            }
        )
    scored.sort(key=lambda x: x["liquidity_depth_score"], reverse=True)
    return scored


def _to_developer_key(value: str) -> str:
    return _to_city_key(value)


def _execution_risk_band(value: float) -> str:
    if value >= 65:
        return "high"
    if value >= 40:
        return "medium"
    return "low"


def _compute_developer_intelligence_scores() -> list[dict]:
    scored: list[dict] = []
    for row in _DEVELOPER_INTELLIGENCE_STORE.values():
        execution_risk_score = _clamp(
            row["api_delivery_delay_pct"] * 2.2
            + row["api_past_litigation_cases"] * 5.8
            + (100.0 - row["api_rera_compliance_score"]) * 0.72
            + (100.0 - row["api_project_completion_ratio_pct"]) * 0.6
            + row["manual_balance_sheet_leverage_ratio"] * 30.0
            + (100.0 - row["manual_past_investor_outcome_score"]) * 0.38,
            0.0,
            100.0,
        )
        reliability_score = _clamp(100.0 - execution_risk_score, 0.0, 100.0)
        scored.append(
            {
                **row,
                "developer_reliability_score": round(reliability_score, 2),
                "execution_risk_band": _execution_risk_band(execution_risk_score),
                "execution_risk_score": round(execution_risk_score, 2),
            }
        )
    scored.sort(key=lambda x: x["developer_reliability_score"], reverse=True)
    return scored


def _to_deal_key(value: str) -> str:
    return _to_city_key(value).replace("_", "-")


def _capital_impairment_band(value: float) -> str:
    if value >= 35:
        return "high"
    if value >= 18:
        return "medium"
    return "low"


def _compute_deal_survival_scores() -> list[dict]:
    scored: list[dict] = []
    for row in _DEAL_SURVIVAL_STORE.values():
        purchase_price = row["manual_purchase_price_cr"] or row["api_purchase_price_cr"] or 0.0
        replacement_cost = row["manual_replacement_cost_cr"] or row["api_replacement_cost_cr"] or 0.0
        ltv = row["manual_ltv_pct"] or row["api_ltv_pct"] or 0.0
        dscr = row["manual_dscr"] or row["api_dscr"] or 0.0
        breakeven_occ = (
            row["manual_break_even_occupancy_pct"]
            or row["api_break_even_occupancy_pct"]
            or 0.0
        )
        rev_stress_10 = row["manual_revenue_stress_10_pct"] or row["api_revenue_stress_10_pct"] or 0.0
        rev_stress_15 = row["manual_revenue_stress_15_pct"] or row["api_revenue_stress_15_pct"] or 0.0
        cap_stress = row["manual_exit_cap_stress_bps"] or row["api_exit_cap_stress_bps"] or 0.0

        replacement_cover_pct = 0.0
        if replacement_cost > 0:
            replacement_cover_pct = (purchase_price / replacement_cost) * 100.0

        capital_impairment_score = _clamp(
            (ltv - 50.0) * 0.9
            + (1.45 - dscr) * 38.0
            + (breakeven_occ - 58.0) * 0.75
            + abs(rev_stress_10) * 0.65
            + abs(rev_stress_15) * 0.8
            + (cap_stress - 35.0) * 0.34
            + (100.0 - replacement_cover_pct) * 0.24,
            0.0,
            100.0,
        )
        survival_probability = _clamp(
            100.0
            - (
                (ltv - 50.0) * 0.58
                + (1.3 - dscr) * 28.0
                + (breakeven_occ - 60.0) * 0.45
                + abs(rev_stress_10) * 0.44
                + abs(rev_stress_15) * 0.56
                + (cap_stress - 45.0) * 0.23
            ),
            0.0,
            100.0,
        )
        downside_irr = _clamp(
            16.5
            - (ltv - 50.0) * 0.17
            - (1.45 - dscr) * 2.8
            - abs(rev_stress_15) * 0.17
            - (cap_stress - 40.0) * 0.028
            - (breakeven_occ - 58.0) * 0.07,
            -25.0,
            30.0,
        )

        scored.append(
            {
                **row,
                "survival_probability": round(survival_probability, 2),
                "downside_irr": round(downside_irr, 2),
                "capital_impairment_score": round(capital_impairment_score, 2),
                "capital_impairment_band": _capital_impairment_band(capital_impairment_score),
            }
        )
    scored.sort(key=lambda x: x["survival_probability"], reverse=True)
    return scored


def _to_sortable_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.min
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is not None:
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return datetime.min


def _flatten_master_rows(entries: list[IntelEntry]) -> list[dict]:
    rows: list[dict] = []
    for entry in entries:
        base = {
            "area": entry.area,
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
        }

        for idx, listing in enumerate(_safe_load(entry.listings_json)):
            rows.append(
                {
                    **base,
                    "record_type": "listing",
                    "record_index": idx,
                    "primary_text": _normalize_str(listing.get("project")),
                    "secondary_text": _normalize_str(listing.get("company")),
                    "status": _normalize_str(listing.get("stage")),
                    "value": _normalize_str(listing.get("priceRange")),
                    "added_at": listing.get("addedAt"),
                    "details": listing,
                }
            )

        for idx, deal in enumerate(_safe_load(entry.broker_deals_json)):
            rows.append(
                {
                    **base,
                    "record_type": "broker_deal",
                    "record_index": idx,
                    "primary_text": _normalize_str(deal.get("asset")),
                    "secondary_text": _normalize_str(deal.get("broker")),
                    "status": _normalize_str(deal.get("status")),
                    "value": _normalize_str(deal.get("price")),
                    "added_at": deal.get("addedAt"),
                    "details": deal,
                }
            )

        for idx, validation in enumerate(_safe_load(entry.validations_json)):
            rows.append(
                {
                    **base,
                    "record_type": "validation",
                    "record_index": idx,
                    "primary_text": _normalize_str(validation.get("summary")),
                    "secondary_text": _normalize_str(validation.get("source")),
                    "status": _normalize_str(validation.get("trend")),
                    "value": _normalize_str(validation.get("confidence")),
                    "added_at": validation.get("addedAt"),
                    "details": validation,
                }
            )
    for idx, city_row in enumerate(_compute_city_rankings()):
        rows.append(
            {
                "area": city_row["city"],
                "updated_at": city_row.get("updatedAt"),
                "record_type": "city_intelligence",
                "record_index": idx,
                "primary_text": city_row["city"],
                "secondary_text": f"Rotation Rank #{city_row['capital_rotation_ranking']}",
                "status": city_row["supply_risk_band"],
                "value": f"{city_row['city_attractiveness_score']}",
                "added_at": city_row.get("updatedAt"),
                "city": city_row["city"],
                "city_attractiveness_score": city_row["city_attractiveness_score"],
                "capital_rotation_ranking": city_row["capital_rotation_ranking"],
                "supply_risk_band": city_row["supply_risk_band"],
                "details": city_row,
            }
        )
    for idx, micro_row in enumerate(_compute_micro_market_scores()):
        rows.append(
            {
                "area": micro_row["city"],
                "updated_at": micro_row.get("updatedAt"),
                "record_type": "micro_market_engine",
                "record_index": idx,
                "primary_text": micro_row["micro_market"],
                "secondary_text": f"{micro_row['city']} micro-market",
                "status": f"Oversupply {micro_row['oversupply_risk']}",
                "value": f"Mispricing {micro_row['mispricing_index']}",
                "added_at": micro_row.get("updatedAt"),
                "city": micro_row["city"],
                "micro_market": micro_row["micro_market"],
                "mispricing_index": micro_row["mispricing_index"],
                "demand_momentum_score": micro_row["demand_momentum_score"],
                "oversupply_risk": micro_row["oversupply_risk"],
                "liquidity_depth_score": micro_row["liquidity_depth_score"],
                "details": micro_row,
            }
        )
    for idx, developer_row in enumerate(_compute_developer_intelligence_scores()):
        rows.append(
            {
                "area": "India",
                "updated_at": developer_row.get("updatedAt"),
                "record_type": "developer_intelligence",
                "record_index": idx,
                "primary_text": developer_row["developer_name"],
                "secondary_text": f"Reliability {developer_row['developer_reliability_score']}",
                "status": developer_row["execution_risk_band"],
                "value": f"Leverage {developer_row['manual_balance_sheet_leverage_ratio']}",
                "added_at": developer_row.get("updatedAt"),
                "developer_name": developer_row["developer_name"],
                "developer_reliability_score": developer_row["developer_reliability_score"],
                "execution_risk_band": developer_row["execution_risk_band"],
                "details": developer_row,
            }
        )
    for idx, deal_row in enumerate(_compute_deal_survival_scores()):
        rows.append(
            {
                "area": "India",
                "updated_at": deal_row.get("updatedAt"),
                "record_type": "deal_survival_engine",
                "record_index": idx,
                "primary_text": deal_row["deal_name"],
                "secondary_text": f"Survival {deal_row['survival_probability']}%",
                "status": deal_row["capital_impairment_band"],
                "value": f"Downside IRR {deal_row['downside_irr']}%",
                "added_at": deal_row.get("updatedAt"),
                "deal_name": deal_row["deal_name"],
                "survival_probability": deal_row["survival_probability"],
                "downside_irr": deal_row["downside_irr"],
                "capital_impairment_band": deal_row["capital_impairment_band"],
                "details": deal_row,
            }
        )
    return rows


@router.get("/master")
def get_intel_master_sheet(
    area: str | None = Query(default=None),
    record_type: str | None = Query(default=None),
    q: str | None = Query(default=None),
    sort_by: str = Query(default="updated_at"),
    sort_dir: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    entries = db.query(IntelEntry).all()
    rows = _flatten_master_rows(entries)

    area_filter = _normalize_str(area).lower()
    if area_filter:
        rows = [row for row in rows if area_filter in row["area"].lower()]

    record_type_filter = _normalize_str(record_type).lower()
    if record_type_filter in {
        "listing",
        "broker_deal",
        "validation",
        "city_intelligence",
        "micro_market_engine",
        "developer_intelligence",
        "deal_survival_engine",
    }:
        rows = [row for row in rows if row["record_type"] == record_type_filter]

    query = _normalize_str(q).lower()
    if query:
        def row_matches(row: dict) -> bool:
            haystack = " ".join(
                [
                    _normalize_str(row.get("area")),
                    _normalize_str(row.get("record_type")),
                    _normalize_str(row.get("primary_text")),
                    _normalize_str(row.get("secondary_text")),
                    _normalize_str(row.get("status")),
                    _normalize_str(row.get("value")),
                    json.dumps(row.get("details", {}), ensure_ascii=False),
                ]
            ).lower()
            return query in haystack

        rows = [row for row in rows if row_matches(row)]

    sort_key = _normalize_str(sort_by).lower()
    reverse = _normalize_str(sort_dir).lower() != "asc"
    if sort_key in {"added_at", "updated_at"}:
        rows.sort(key=lambda row: _to_sortable_datetime(row.get(sort_key)), reverse=reverse)
    elif sort_key in {
        "area",
        "city",
        "micro_market",
        "developer_name",
        "deal_name",
        "record_type",
        "primary_text",
        "secondary_text",
        "status",
        "value",
        "supply_risk_band",
        "execution_risk_band",
        "capital_impairment_band",
    }:
        rows.sort(key=lambda row: _normalize_str(row.get(sort_key)).lower(), reverse=reverse)
    elif sort_key in {
        "city_attractiveness_score",
        "capital_rotation_ranking",
        "mispricing_index",
        "demand_momentum_score",
        "oversupply_risk",
        "liquidity_depth_score",
        "developer_reliability_score",
        "survival_probability",
        "downside_irr",
    }:
        rows.sort(key=lambda row: float(row.get(sort_key) or 0.0), reverse=reverse)
    else:
        rows.sort(key=lambda row: _to_sortable_datetime(row.get("updated_at")), reverse=True)

    total = len(rows)
    total_pages = max(1, math.ceil(total / limit))
    start = (page - 1) * limit
    end = start + limit
    paged_rows = rows[start:end]

    return {
        "items": paged_rows,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    }


@router.get("/city-intelligence")
def get_city_intelligence(
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    return {
        "as_of": datetime.utcnow().date().isoformat(),
        "cities": _compute_city_rankings(),
    }


@router.put("/city-intelligence/{city_key}")
def upsert_city_intelligence(
    city_key: str,
    payload: CityIntelligenceInput,
    _user=Depends(require_roles(ALLOWED_EDITOR_ROLES)),
):
    now = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    key = _to_city_key(city_key or payload.city)
    _CITY_INTELLIGENCE_STORE[key] = {
        **payload.dict(),
        "city": payload.city or city_key,
        "updatedAt": payload.updatedAt or now,
    }
    return {
        "ok": True,
        "city": _CITY_INTELLIGENCE_STORE[key],
    }


@router.get("/micro-markets")
def get_micro_market_engine(
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    return {
        "as_of": datetime.utcnow().date().isoformat(),
        "micro_markets": _compute_micro_market_scores(),
    }


@router.put("/micro-markets/{city_key}/{market_key}")
def upsert_micro_market_engine(
    city_key: str,
    market_key: str,
    payload: MicroMarketInput,
    _user=Depends(require_roles(ALLOWED_EDITOR_ROLES)),
):
    now = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    key = _to_micro_key(city_key or payload.city, market_key or payload.micro_market)
    _MICRO_MARKET_STORE[key] = {
        **payload.dict(),
        "city": payload.city or city_key,
        "micro_market": payload.micro_market or market_key,
        "updatedAt": payload.updatedAt or now,
    }
    return {
        "ok": True,
        "micro_market": _MICRO_MARKET_STORE[key],
    }


@router.get("/developer-intelligence")
def get_developer_intelligence(
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    return {
        "as_of": datetime.utcnow().date().isoformat(),
        "api_sourced_fields": [
            "api_delivery_delay_pct",
            "api_past_litigation_cases",
            "api_rera_compliance_score",
            "api_project_completion_ratio_pct",
        ],
        "manual_fields": [
            "manual_balance_sheet_leverage_ratio",
            "manual_past_investor_outcome_score",
        ],
        "developers": _compute_developer_intelligence_scores(),
    }


@router.put("/developer-intelligence/{developer_key}")
def upsert_developer_intelligence(
    developer_key: str,
    payload: DeveloperIntelligenceInput,
    _user=Depends(require_roles(ALLOWED_MANUAL_INPUT_ROLES)),
):
    now = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    key = _to_developer_key(developer_key or payload.developer_name)
    existing = dict(
        _DEVELOPER_INTELLIGENCE_STORE.get(
            key,
            {
                "developer_name": payload.developer_name or developer_key,
                "api_delivery_delay_pct": 0.0,
                "api_past_litigation_cases": 0.0,
                "api_rera_compliance_score": 0.0,
                "api_project_completion_ratio_pct": 0.0,
            },
        )
    )
    existing.update(
        {
            "developer_name": payload.developer_name or developer_key,
            "manual_balance_sheet_leverage_ratio": payload.manual_balance_sheet_leverage_ratio,
            "manual_past_investor_outcome_score": payload.manual_past_investor_outcome_score,
            "updatedAt": payload.updatedAt or now,
        }
    )
    _DEVELOPER_INTELLIGENCE_STORE[key] = existing
    return {
        "ok": True,
        "developer": _DEVELOPER_INTELLIGENCE_STORE[key],
    }


@router.get("/deal-survival")
def get_deal_survival_engine(
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    return {
        "as_of": datetime.utcnow().date().isoformat(),
        "api_sourced_fields": [
            "api_purchase_price_cr",
            "api_replacement_cost_cr",
            "api_ltv_pct",
            "api_dscr",
            "api_break_even_occupancy_pct",
            "api_revenue_stress_10_pct",
            "api_revenue_stress_15_pct",
            "api_exit_cap_stress_bps",
        ],
        "manual_fields": [
            "manual_purchase_price_cr",
            "manual_replacement_cost_cr",
            "manual_ltv_pct",
            "manual_dscr",
            "manual_break_even_occupancy_pct",
            "manual_revenue_stress_10_pct",
            "manual_revenue_stress_15_pct",
            "manual_exit_cap_stress_bps",
        ],
        "deals": _compute_deal_survival_scores(),
    }


@router.put("/deal-survival/{deal_key}")
def upsert_deal_survival_engine(
    deal_key: str,
    payload: DealSurvivalInput,
    _user=Depends(require_roles(ALLOWED_MANUAL_INPUT_ROLES)),
):
    now = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    key = _to_deal_key(deal_key or payload.deal_name)
    existing = dict(
        _DEAL_SURVIVAL_STORE.get(
            key,
            {
                "deal_name": payload.deal_name or deal_key,
                "api_purchase_price_cr": 0.0,
                "api_replacement_cost_cr": 0.0,
                "api_ltv_pct": 0.0,
                "api_dscr": 0.0,
                "api_break_even_occupancy_pct": 0.0,
                "api_revenue_stress_10_pct": 0.0,
                "api_revenue_stress_15_pct": 0.0,
                "api_exit_cap_stress_bps": 0.0,
            },
        )
    )
    existing.update(
        {
            "deal_name": payload.deal_name or deal_key,
            "manual_purchase_price_cr": payload.manual_purchase_price_cr,
            "manual_replacement_cost_cr": payload.manual_replacement_cost_cr,
            "manual_ltv_pct": payload.manual_ltv_pct,
            "manual_dscr": payload.manual_dscr,
            "manual_break_even_occupancy_pct": payload.manual_break_even_occupancy_pct,
            "manual_revenue_stress_10_pct": payload.manual_revenue_stress_10_pct,
            "manual_revenue_stress_15_pct": payload.manual_revenue_stress_15_pct,
            "manual_exit_cap_stress_bps": payload.manual_exit_cap_stress_bps,
            "updatedAt": payload.updatedAt or now,
        }
    )
    _DEAL_SURVIVAL_STORE[key] = existing
    return {
        "ok": True,
        "deal": _DEAL_SURVIVAL_STORE[key],
    }


@router.get("/{area}", response_model=IntelPayload)
def get_intel_by_area(
    area: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    key = _normalize_area(area)
    entry = db.query(IntelEntry).filter(IntelEntry.area == key).first()
    return _to_payload(entry)


@router.put("/{area}", response_model=IntelPayload)
def save_intel_by_area(
    area: str,
    payload: IntelPayload,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    key = _normalize_area(area)
    entry = db.query(IntelEntry).filter(IntelEntry.area == key).first()
    if not entry:
        entry = IntelEntry(area=key)
        db.add(entry)

    payload_dict = payload.dict()
    entry.listings_json = json.dumps(payload_dict.get("listings", []))
    entry.broker_deals_json = json.dumps(payload_dict.get("brokerDeals", []))
    entry.validations_json = json.dumps(payload_dict.get("validations", []))
    db.commit()
    db.refresh(entry)
    return _to_payload(entry)

