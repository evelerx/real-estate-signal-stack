from typing import List

from pydantic import BaseModel, Field


class IntelListing(BaseModel):
    company: str = ""
    project: str = ""
    stage: str = ""
    priceRange: str = ""
    addedAt: str | None = None


class IntelBrokerDeal(BaseModel):
    broker: str = ""
    asset: str = ""
    status: str = ""
    price: str = ""
    notes: str = ""
    addedAt: str | None = None


class IntelValidation(BaseModel):
    summary: str = ""
    trend: str = ""
    confidence: str = ""
    source: str = ""
    addedAt: str | None = None


class IntelPayload(BaseModel):
    listings: List[IntelListing] = Field(default_factory=list)
    brokerDeals: List[IntelBrokerDeal] = Field(default_factory=list)
    validations: List[IntelValidation] = Field(default_factory=list)


class CityIntelligenceInput(BaseModel):
    city: str
    employment_growth_services_pct: float = 0.0
    employment_growth_manufacturing_pct: float = 0.0
    office_absorption_msf: float = 0.0
    it_expansion_index: float = 0.0
    manufacturing_expansion_index: float = 0.0
    migration_inflow_k: float = 0.0
    infrastructure_project_index: float = 0.0
    residential_price_cagr_5y_pct: float = 0.0
    residential_price_cagr_10y_pct: float = 0.0
    rental_yield_pct: float = 0.0
    rental_yield_trend_bps: float = 0.0
    transaction_volume_cr: float = 0.0
    units_under_construction: float = 0.0
    updatedAt: str | None = None


class MicroMarketInput(BaseModel):
    city: str
    micro_market: str
    price_psf_3y_ago: float = 0.0
    price_psf_2y_ago: float = 0.0
    price_psf_1y_ago: float = 0.0
    price_psf_current: float = 0.0
    rental_yield_pct: float = 0.0
    units_under_construction: float = 0.0
    months_of_inventory: float = 0.0
    absorption_rate_pct: float = 0.0
    developer_concentration_pct: float = 0.0
    land_price_movement_3y_pct: float = 0.0
    transaction_depth_index: float = 0.0
    updatedAt: str | None = None


class DeveloperIntelligenceInput(BaseModel):
    developer_name: str
    manual_balance_sheet_leverage_ratio: float = 0.0
    manual_past_investor_outcome_score: float = 0.0
    updatedAt: str | None = None


class DealSurvivalInput(BaseModel):
    deal_name: str
    manual_purchase_price_cr: float = 0.0
    manual_replacement_cost_cr: float = 0.0
    manual_ltv_pct: float = 0.0
    manual_dscr: float = 0.0
    manual_break_even_occupancy_pct: float = 0.0
    manual_revenue_stress_10_pct: float = 0.0
    manual_revenue_stress_15_pct: float = 0.0
    manual_exit_cap_stress_bps: float = 0.0
    updatedAt: str | None = None
