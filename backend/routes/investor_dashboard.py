from fastapi import APIRouter, Depends, HTTPException, Query

from services.rbac import require_roles

router = APIRouter(prefix="/dashboard", tags=["Investor Dashboard"])

ALLOWED_DASHBOARD_ROLES = ["admin"]

_KPIS = {
    "total_portfolio_value_m": {"value": 17.3, "delta_pct": -2.8, "previous_m": 17.8},
    "roi_pct": {"value": 6.8, "delta_pct": 4.6, "previous_pct": 6.5},
    "cap_rate_pct": {"value": 5.9, "delta_pct": -3.1, "previous_pct": 6.1},
    "occupancy_pct": {"value": 85.0, "delta_pct": -4.5, "previous_pct": 89.0},
}

_ROI_SERIES = [
    {"month": "Jan 2024", "roi_pct": 5.2},
    {"month": "Feb 2024", "roi_pct": 5.8},
    {"month": "Mar 2024", "roi_pct": 6.1},
    {"month": "Apr 2024", "roi_pct": 6.0},
    {"month": "May 2024", "roi_pct": 6.0},
    {"month": "Jun 2024", "roi_pct": 6.1},
    {"month": "Jul 2024", "roi_pct": 6.3},
    {"month": "Aug 2024", "roi_pct": 6.4},
    {"month": "Sep 2024", "roi_pct": 6.2},
    {"month": "Oct 2024", "roi_pct": 6.8},
    {"month": "Nov 2024", "roi_pct": 6.5},
    {"month": "Dec 2024", "roi_pct": 6.8},
]

_CAP_RATE_BY_TYPE = [
    {"property_type": "Apartments", "cap_rate_pct": 5.2},
    {"property_type": "Office", "cap_rate_pct": 5.4},
    {"property_type": "Retail", "cap_rate_pct": 5.6},
    {"property_type": "Industrial", "cap_rate_pct": 6.1},
    {"property_type": "Single-Family", "cap_rate_pct": 5.9},
]

_MAINTENANCE_BREAKDOWN = [
    {"period": "Q1", "repairs": 180, "utilities": 130, "prevention": 95, "fees": 120, "emergency": 75},
    {"period": "Q2", "repairs": 195, "utilities": 140, "prevention": 98, "fees": 126, "emergency": 80},
    {"period": "Q3", "repairs": 205, "utilities": 148, "prevention": 105, "fees": 133, "emergency": 84},
    {"period": "Q4", "repairs": 210, "utilities": 150, "prevention": 110, "fees": 135, "emergency": 86},
    {"period": "Q5", "repairs": 198, "utilities": 144, "prevention": 102, "fees": 131, "emergency": 82},
    {"period": "Q6", "repairs": 220, "utilities": 153, "prevention": 115, "fees": 139, "emergency": 90},
]

_OCCUPANCY_MIX = [
    {"segment": "Occupied Units", "units_pct": 67.79},
    {"segment": "Vacant Units", "units_pct": 32.21},
]

_PROJECTED_CASHFLOW = [
    {"month": "Jan", "net_sales_k": 78, "goal_k": 90},
    {"month": "Feb", "net_sales_k": 115, "goal_k": 108},
    {"month": "Mar", "net_sales_k": 128, "goal_k": 120},
    {"month": "Apr", "net_sales_k": 132, "goal_k": 128},
    {"month": "May", "net_sales_k": 126, "goal_k": 122},
    {"month": "Jun", "net_sales_k": 138, "goal_k": 130},
    {"month": "Jul", "net_sales_k": 142, "goal_k": 133},
    {"month": "Aug", "net_sales_k": 130, "goal_k": 125},
    {"month": "Sep", "net_sales_k": 145, "goal_k": 136},
    {"month": "Oct", "net_sales_k": 136, "goal_k": 131},
    {"month": "Nov", "net_sales_k": 150, "goal_k": 140},
    {"month": "Dec", "net_sales_k": 98, "goal_k": 118},
]

_INVESTMENT_ACTIVITY = [
    {"year": 2017, "acquisition_b": 42.0, "disposition_b": 18.0, "net_b": 24.0},
    {"year": 2018, "acquisition_b": 38.0, "disposition_b": 20.0, "net_b": 18.0},
    {"year": 2019, "acquisition_b": 46.0, "disposition_b": 22.0, "net_b": 24.0},
    {"year": 2020, "acquisition_b": 31.0, "disposition_b": 26.0, "net_b": 5.0},
    {"year": 2021, "acquisition_b": 57.0, "disposition_b": 24.0, "net_b": 33.0},
    {"year": 2022, "acquisition_b": 53.0, "disposition_b": 29.0, "net_b": 24.0},
    {"year": 2023, "acquisition_b": 61.0, "disposition_b": 35.0, "net_b": 26.0},
    {"year": 2024, "acquisition_b": 58.0, "disposition_b": 31.0, "net_b": 27.0},
    {"year": 2025, "acquisition_b": 64.0, "disposition_b": 33.0, "net_b": 31.0},
]

_MARKET_HOLDINGS = [
    {"market": "Los Angeles", "properties": 160, "est_value_m": 11770, "share_pct": 4.0},
    {"market": "Manhattan", "properties": 40, "est_value_m": 10656, "share_pct": 4.0},
    {"market": "Boston", "properties": 78, "est_value_m": 8584, "share_pct": 3.0},
    {"market": "Seattle", "properties": 105, "est_value_m": 8051, "share_pct": 3.0},
    {"market": "San Diego", "properties": 112, "est_value_m": 6508, "share_pct": 2.0},
]

_PROPERTY_HOLDINGS = [
    {"property_type": "Industrial", "properties": 4988, "est_value_m": 111351, "share_pct": 37.0},
    {"property_type": "Hotel", "properties": 909, "est_value_m": 24555, "share_pct": 8.0},
    {"property_type": "Apartment", "properties": 1427, "est_value_m": 69306, "share_pct": 23.0},
    {"property_type": "Office", "properties": 1109, "est_value_m": 57597, "share_pct": 19.0},
    {"property_type": "Retail", "properties": 349, "est_value_m": 16677, "share_pct": 6.0},
]

_COVERAGE_POINTS = [
    {"city": "Los Angeles", "country": "USA", "lat": 34.05, "lng": -118.24, "weight": 84},
    {"city": "New York", "country": "USA", "lat": 40.71, "lng": -74.00, "weight": 91},
    {"city": "London", "country": "UK", "lat": 51.50, "lng": -0.12, "weight": 76},
    {"city": "Paris", "country": "France", "lat": 48.85, "lng": 2.35, "weight": 68},
    {"city": "Tokyo", "country": "Japan", "lat": 35.67, "lng": 139.65, "weight": 72},
    {"city": "Mumbai", "country": "India", "lat": 19.07, "lng": 72.87, "weight": 81},
]

_RELATIONSHIPS = {
    "venture_partners": [
        {"name": "M7 Real Estate", "properties": 592},
        {"name": "Starwood Capital", "properties": 588},
        {"name": "CDPQ", "properties": 386},
        {"name": "AREIM", "properties": 137},
        {"name": "Regis Group Plc", "properties": 108},
    ],
    "brokers": [
        {"name": "Knight Frank", "properties": 248},
        {"name": "CBRE", "properties": 233},
        {"name": "JLL", "properties": 217},
        {"name": "Savills", "properties": 151},
        {"name": "Cushman & Wakefield", "properties": 119},
    ],
    "lenders": [
        {"name": "Goldman Sachs", "properties": 212},
        {"name": "Morgan Stanley", "properties": 194},
        {"name": "JP Morgan", "properties": 168},
        {"name": "BlackRock Debt Strategies", "properties": 141},
        {"name": "Barclays", "properties": 128},
    ],
}

_TRANSACTIONS = [
    {"date": "2025-09-18", "market": "Mumbai", "property_type": "Office", "value_m": 132, "side": "Acquisition"},
    {"date": "2025-08-02", "market": "London", "property_type": "Retail", "value_m": 74, "side": "Disposition"},
    {"date": "2025-06-27", "market": "New York", "property_type": "Industrial", "value_m": 168, "side": "Acquisition"},
    {"date": "2025-05-15", "market": "Tokyo", "property_type": "Apartment", "value_m": 91, "side": "Acquisition"},
]

_KNOWN_HOLDINGS = [
    {"asset": "Harbor One Campus", "market": "Boston", "property_type": "Office", "units": 4, "est_value_m": 305},
    {"asset": "Crescent Logistics Park", "market": "Los Angeles", "property_type": "Industrial", "units": 8, "est_value_m": 412},
    {"asset": "Helios Retail Arcade", "market": "London", "property_type": "Retail", "units": 3, "est_value_m": 225},
]

_MORTGAGE_DEBT = [
    {"lender": "Goldman Sachs", "facility": "Term Loan A", "balance_m": 190, "coupon_pct": 6.2, "maturity": "2028-06-30"},
    {"lender": "JP Morgan", "facility": "Bridge Facility", "balance_m": 125, "coupon_pct": 7.1, "maturity": "2027-11-15"},
    {"lender": "Barclays", "facility": "Secured Loan", "balance_m": 86, "coupon_pct": 5.8, "maturity": "2029-03-01"},
]

_FIRM_HOLDINGS_SUMMARY = [
    {"name": "Apex Capital", "properties_owned": 214, "avg_property_price_m": 42.8},
    {"name": "Summit RE Partners", "properties_owned": 189, "avg_property_price_m": 39.6},
    {"name": "HarborStone Investments", "properties_owned": 163, "avg_property_price_m": 46.2},
    {"name": "Northbridge Realty", "properties_owned": 142, "avg_property_price_m": 35.9},
]

_FIRM_CAPITAL_BY_PROPERTY = [
    {
        "firm": "Apex Capital",
        "residential_b": 2.1,
        "commercial_b": 1.6,
        "industrial_b": 1.2,
        "retail_b": 0.7,
    },
    {
        "firm": "Summit RE Partners",
        "residential_b": 1.5,
        "commercial_b": 2.0,
        "industrial_b": 0.9,
        "retail_b": 0.6,
    },
    {
        "firm": "HarborStone Investments",
        "residential_b": 1.1,
        "commercial_b": 1.3,
        "industrial_b": 1.8,
        "retail_b": 0.4,
    },
    {
        "firm": "Northbridge Realty",
        "residential_b": 0.9,
        "commercial_b": 1.7,
        "industrial_b": 0.8,
        "retail_b": 1.1,
    },
]

_FIRM_AREA_PRIORITIES = {
    "Apex Capital": [
        {"area": "Wakad", "city": "Pune", "lat": 18.599, "lng": 73.763, "priority_score": 93, "invested_capital_b": 1.36},
        {"area": "Whitefield", "city": "Bengaluru", "lat": 12.969, "lng": 77.75, "priority_score": 86, "invested_capital_b": 1.09},
        {"area": "Thane West", "city": "Mumbai", "lat": 19.218, "lng": 72.978, "priority_score": 61, "invested_capital_b": 0.74},
        {"area": "Andheri East", "city": "Mumbai", "lat": 19.113, "lng": 72.869, "priority_score": 41, "invested_capital_b": 0.41},
    ],
    "Summit RE Partners": [
        {"area": "BKC", "city": "Mumbai", "lat": 19.06, "lng": 72.868, "priority_score": 90, "invested_capital_b": 1.28},
        {"area": "Hinjewadi", "city": "Pune", "lat": 18.592, "lng": 73.738, "priority_score": 78, "invested_capital_b": 0.97},
        {"area": "Gachibowli", "city": "Hyderabad", "lat": 17.442, "lng": 78.363, "priority_score": 66, "invested_capital_b": 0.72},
        {"area": "Koramangala", "city": "Bengaluru", "lat": 12.935, "lng": 77.614, "priority_score": 44, "invested_capital_b": 0.38},
    ],
    "HarborStone Investments": [
        {"area": "Oragadam", "city": "Chennai", "lat": 12.829, "lng": 79.973, "priority_score": 88, "invested_capital_b": 1.14},
        {"area": "Chakan", "city": "Pune", "lat": 18.758, "lng": 73.862, "priority_score": 84, "invested_capital_b": 1.02},
        {"area": "Bhiwandi", "city": "Mumbai Region", "lat": 19.281, "lng": 73.048, "priority_score": 72, "invested_capital_b": 0.86},
        {"area": "Noida Sec 62", "city": "Noida", "lat": 28.627, "lng": 77.373, "priority_score": 36, "invested_capital_b": 0.29},
    ],
    "Northbridge Realty": [
        {"area": "Connaught Place", "city": "Delhi", "lat": 28.631, "lng": 77.216, "priority_score": 81, "invested_capital_b": 0.92},
        {"area": "Banjara Hills", "city": "Hyderabad", "lat": 17.415, "lng": 78.434, "priority_score": 74, "invested_capital_b": 0.81},
        {"area": "MG Road", "city": "Bengaluru", "lat": 12.975, "lng": 77.607, "priority_score": 58, "invested_capital_b": 0.56},
        {"area": "Park Street", "city": "Kolkata", "lat": 22.552, "lng": 88.352, "priority_score": 32, "invested_capital_b": 0.22},
    ],
}

_INDIA_MACRO_CAPITAL_FLOW_SERIES = [
    {
        "period": "2023-Q1",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.28,
        "bank_credit_growth_pct": 15.6,
        "nbfc_lending_growth_pct": 19.4,
        "home_loan_rate_pct": 8.45,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.5,
        "construction_cost_inflation_pct": 8.9,
        "real_estate_fdi_usd_b": 1.92,
        "cmbs_reit_yield_spread_bps": 255,
    },
    {
        "period": "2023-Q2",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.18,
        "bank_credit_growth_pct": 15.2,
        "nbfc_lending_growth_pct": 18.8,
        "home_loan_rate_pct": 8.62,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.9,
        "construction_cost_inflation_pct": 8.2,
        "real_estate_fdi_usd_b": 2.08,
        "cmbs_reit_yield_spread_bps": 248,
    },
    {
        "period": "2023-Q3",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.21,
        "bank_credit_growth_pct": 14.8,
        "nbfc_lending_growth_pct": 18.1,
        "home_loan_rate_pct": 8.84,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 68.4,
        "construction_cost_inflation_pct": 7.7,
        "real_estate_fdi_usd_b": 1.76,
        "cmbs_reit_yield_spread_bps": 261,
    },
    {
        "period": "2023-Q4",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.16,
        "bank_credit_growth_pct": 14.2,
        "nbfc_lending_growth_pct": 17.3,
        "home_loan_rate_pct": 9.02,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 68.0,
        "construction_cost_inflation_pct": 7.3,
        "real_estate_fdi_usd_b": 2.14,
        "cmbs_reit_yield_spread_bps": 274,
    },
    {
        "period": "2024-Q1",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.10,
        "bank_credit_growth_pct": 13.9,
        "nbfc_lending_growth_pct": 16.9,
        "home_loan_rate_pct": 8.96,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.6,
        "construction_cost_inflation_pct": 6.8,
        "real_estate_fdi_usd_b": 1.98,
        "cmbs_reit_yield_spread_bps": 266,
    },
    {
        "period": "2024-Q2",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 7.03,
        "bank_credit_growth_pct": 13.5,
        "nbfc_lending_growth_pct": 16.1,
        "home_loan_rate_pct": 8.86,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.3,
        "construction_cost_inflation_pct": 6.2,
        "real_estate_fdi_usd_b": 2.24,
        "cmbs_reit_yield_spread_bps": 258,
    },
    {
        "period": "2024-Q3",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 6.96,
        "bank_credit_growth_pct": 13.1,
        "nbfc_lending_growth_pct": 15.4,
        "home_loan_rate_pct": 8.79,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 66.8,
        "construction_cost_inflation_pct": 5.9,
        "real_estate_fdi_usd_b": 2.31,
        "cmbs_reit_yield_spread_bps": 251,
    },
    {
        "period": "2024-Q4",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 6.92,
        "bank_credit_growth_pct": 12.8,
        "nbfc_lending_growth_pct": 14.8,
        "home_loan_rate_pct": 8.72,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 66.4,
        "construction_cost_inflation_pct": 5.5,
        "real_estate_fdi_usd_b": 2.42,
        "cmbs_reit_yield_spread_bps": 246,
    },
    {
        "period": "2025-Q1",
        "rbi_policy_rate_pct": 6.50,
        "gsec_10y_yield_pct": 6.99,
        "bank_credit_growth_pct": 12.6,
        "nbfc_lending_growth_pct": 14.2,
        "home_loan_rate_pct": 8.76,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 66.6,
        "construction_cost_inflation_pct": 5.2,
        "real_estate_fdi_usd_b": 2.56,
        "cmbs_reit_yield_spread_bps": 249,
    },
    {
        "period": "2025-Q2",
        "rbi_policy_rate_pct": 6.25,
        "gsec_10y_yield_pct": 6.91,
        "bank_credit_growth_pct": 12.9,
        "nbfc_lending_growth_pct": 14.7,
        "home_loan_rate_pct": 8.64,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 66.9,
        "construction_cost_inflation_pct": 5.0,
        "real_estate_fdi_usd_b": 2.73,
        "cmbs_reit_yield_spread_bps": 244,
    },
    {
        "period": "2025-Q3",
        "rbi_policy_rate_pct": 6.25,
        "gsec_10y_yield_pct": 6.86,
        "bank_credit_growth_pct": 13.2,
        "nbfc_lending_growth_pct": 15.1,
        "home_loan_rate_pct": 8.55,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.3,
        "construction_cost_inflation_pct": 4.7,
        "real_estate_fdi_usd_b": 2.88,
        "cmbs_reit_yield_spread_bps": 238,
    },
    {
        "period": "2025-Q4",
        "rbi_policy_rate_pct": 6.25,
        "gsec_10y_yield_pct": 6.81,
        "bank_credit_growth_pct": 13.7,
        "nbfc_lending_growth_pct": 15.8,
        "home_loan_rate_pct": 8.47,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 67.8,
        "construction_cost_inflation_pct": 4.3,
        "real_estate_fdi_usd_b": 3.02,
        "cmbs_reit_yield_spread_bps": 232,
    },
    {
        "period": "2026-Q1",
        "rbi_policy_rate_pct": 6.25,
        "gsec_10y_yield_pct": 6.78,
        "bank_credit_growth_pct": 14.1,
        "nbfc_lending_growth_pct": 16.2,
        "home_loan_rate_pct": 8.41,
        "ltv_norm_pct": 80.0,
        "debt_financed_purchase_pct": 68.4,
        "construction_cost_inflation_pct": 4.1,
        "real_estate_fdi_usd_b": 3.17,
        "cmbs_reit_yield_spread_bps": 228,
    },
]

_INDIA_INSTITUTION_TRACKING = [
    {
        "institution": "Reserve Bank of India",
        "focus": "Policy rate path, system liquidity, transmission to mortgage and developer credit",
        "last_publication_date": "2026-02-14",
    },
    {
        "institution": "National Housing Bank",
        "focus": "Housing finance company trends, refinance conditions, home loan affordability",
        "last_publication_date": "2026-02-11",
    },
]

_PEER_FIRM_TRACKING = [
    {
        "firm": "Blackstone India Real Estate",
        "strategy_focus": "Logistics + office",
        "recent_signal": "Acquisition pacing stable; refinancing risk low",
        "watch_level": "low",
    },
    {
        "firm": "Brookfield India RE",
        "strategy_focus": "REIT office + mixed commercial",
        "recent_signal": "Yield discipline maintained; selective deployments",
        "watch_level": "medium",
    },
    {
        "firm": "GIC Real Estate India",
        "strategy_focus": "Residential platforms + warehousing",
        "recent_signal": "Credit partnerships expanding via domestic NBFCs",
        "watch_level": "medium",
    },
    {
        "firm": "CapitaLand India",
        "strategy_focus": "Business parks + industrial",
        "recent_signal": "Construction inflation easing supports margins",
        "watch_level": "low",
    },
]


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(value, hi))


def _credit_cycle_label(indicator: float) -> str:
    if indicator >= 12:
        return "expansion"
    if indicator <= -12:
        return "contraction"
    return "neutral"


def _build_india_macro_capital_flow_payload() -> dict:
    latest = _INDIA_MACRO_CAPITAL_FLOW_SERIES[-1]
    previous = _INDIA_MACRO_CAPITAL_FLOW_SERIES[-2]

    rate_sensitivity_index = _clamp(
        (latest["rbi_policy_rate_pct"] - 5.0) * 18.0
        + (latest["gsec_10y_yield_pct"] - 6.0) * 12.0
        + (latest["home_loan_rate_pct"] - 7.5) * 22.0
        + (latest["debt_financed_purchase_pct"] - 55.0) * 0.9,
        0.0,
        100.0,
    )
    liquidity_tightening_signal = _clamp(
        (14.5 - latest["bank_credit_growth_pct"]) * 5.1
        + (16.8 - latest["nbfc_lending_growth_pct"]) * 3.8
        + (latest["cmbs_reit_yield_spread_bps"] - 200.0) * 0.22
        + latest["construction_cost_inflation_pct"] * 3.4
        + (latest["rbi_policy_rate_pct"] - previous["rbi_policy_rate_pct"]) * 25.0,
        0.0,
        100.0,
    )
    credit_cycle_indicator = _clamp(
        latest["bank_credit_growth_pct"] * 0.58
        + latest["nbfc_lending_growth_pct"] * 0.42
        + (latest["real_estate_fdi_usd_b"] - previous["real_estate_fdi_usd_b"]) * 8.5
        - (latest["home_loan_rate_pct"] - previous["home_loan_rate_pct"]) * 16.0
        - (latest["cmbs_reit_yield_spread_bps"] - previous["cmbs_reit_yield_spread_bps"]) * 0.18
        - 13.0,
        -100.0,
        100.0,
    )

    return {
        "as_of": "2026-02-18",
        "institutions": _INDIA_INSTITUTION_TRACKING,
        "timeseries": _INDIA_MACRO_CAPITAL_FLOW_SERIES,
        "signals": {
            "rate_sensitivity_index": round(rate_sensitivity_index, 2),
            "liquidity_tightening_signal": round(liquidity_tightening_signal, 2),
            "credit_expansion_contraction_cycle_indicator": round(credit_cycle_indicator, 2),
            "credit_cycle_phase": _credit_cycle_label(credit_cycle_indicator),
        },
        "peer_firm_tracking": _PEER_FIRM_TRACKING,
    }


def _normalize_filter(value: str | None) -> str:
    return (value or "").strip().lower()


def _filter_by_property_type(items: list[dict], property_type: str | None, field: str) -> list[dict]:
    needle = _normalize_filter(property_type)
    if not needle or needle in {"all", "all property types"}:
        return items
    return [item for item in items if _normalize_filter(item.get(field)) == needle]


@router.get("/workspace")
def get_dashboard_workspace(
    geography: str | None = Query(None),
    property_type: str | None = Query(None),
    period: str | None = Query("last_quarter"),
    _user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES)),
):
    india_macro_layer = _build_india_macro_capital_flow_payload()
    return {
        "as_of": "2026-02-18",
        "filters": {
            "geography": geography or "All geographies",
            "property_type": property_type or "All property types",
            "period": period or "last_quarter",
        },
        "kpis": _KPIS,
        "roi_series": _ROI_SERIES,
        "cap_rate_by_type": _CAP_RATE_BY_TYPE,
        "maintenance_breakdown": _MAINTENANCE_BREAKDOWN,
        "occupancy_mix": _OCCUPANCY_MIX,
        "projected_cashflow": _PROJECTED_CASHFLOW,
        "investment_activity": _INVESTMENT_ACTIVITY,
        "market_coverage": {
            "points": _COVERAGE_POINTS,
            "markets": _MARKET_HOLDINGS,
            "property_mix": _PROPERTY_HOLDINGS,
        },
        "relationships": _RELATIONSHIPS,
        "firm_allocation_intel": {
            "firm_holdings_summary": _FIRM_HOLDINGS_SUMMARY,
            "capital_by_property_type_b": _FIRM_CAPITAL_BY_PROPERTY,
            "area_priority_by_firm": _FIRM_AREA_PRIORITIES,
        },
        "india_macro_capital_flow": india_macro_layer,
    }


@router.get("/market-coverage")
def get_market_coverage(
    property_type: str | None = Query(None),
    _user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES)),
):
    return {
        "points": _COVERAGE_POINTS,
        "markets": _MARKET_HOLDINGS,
        "property_mix": _filter_by_property_type(_PROPERTY_HOLDINGS, property_type, "property_type"),
    }


@router.get("/investment-activity")
def get_investment_activity(_user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES))):
    return _INVESTMENT_ACTIVITY


@router.get("/india-macro-capital-flow")
def get_india_macro_capital_flow(_user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES))):
    return _build_india_macro_capital_flow_payload()


@router.get("/relationships")
def get_relationships(
    relationship_type: str = Query("venture_partners"),
    _user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES)),
):
    key = _normalize_filter(relationship_type)
    if key not in _RELATIONSHIPS:
        raise HTTPException(status_code=400, detail="Invalid relationship type")
    return {"relationship_type": key, "items": _RELATIONSHIPS[key]}


@router.get("/transactions")
def get_transactions(
    property_type: str | None = Query(None),
    _user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES)),
):
    return _filter_by_property_type(_TRANSACTIONS, property_type, "property_type")


@router.get("/known-holdings")
def get_known_holdings(
    property_type: str | None = Query(None),
    _user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES)),
):
    return _filter_by_property_type(_KNOWN_HOLDINGS, property_type, "property_type")


@router.get("/mortgage-debt")
def get_mortgage_debt(_user=Depends(require_roles(ALLOWED_DASHBOARD_ROLES))):
    return _MORTGAGE_DEBT

