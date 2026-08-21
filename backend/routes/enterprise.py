from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from services.enterprise_engine import (
    AllocationInput,
    DownsideInput,
    downside_probability,
    get_macro_credit_overview,
    generate_ic_memo,
    get_city_intelligence,
    get_developer_intelligence,
    simulate_allocation,
)
from services.rbac import require_roles


router = APIRouter(prefix="/enterprise", tags=["Enterprise Intelligence"])

ALLOWED_ROLES = ["ceo", "data_analyst", "subscriptionowner"]


class CapitalAllocationSimInput(BaseModel):
    target_irr: float = Field(..., ge=4, le=40)
    max_ltv: float = Field(..., ge=10, le=90)
    risk_tolerance: str = Field(..., pattern="^(low|medium|high)$")
    holding_period_years: int = Field(..., ge=1, le=15)
    sector_targets: dict[str, float] = Field(..., min_length=1)
    total_capital_cr: float = Field(..., gt=0)


class DownsideModelInput(BaseModel):
    revenue_shock_pct: float = Field(..., ge=0, le=80)
    rate_shock_bps: float = Field(..., ge=0, le=1200)
    cap_rate_expansion_bps: float = Field(..., ge=0, le=1200)
    liquidity_contraction_pct: float = Field(..., ge=0, le=100)
    base_default_probability_pct: float = Field(..., ge=0, le=100)


class ICMemoInput(BaseModel):
    deal_name: str = Field(..., min_length=3, max_length=200)
    city: str = Field(..., min_length=2, max_length=80)
    micro_market: str = Field(..., min_length=2, max_length=120)
    target_equity_cr: float = Field(..., gt=0)
    downside: DownsideModelInput


@router.get("/city-intelligence")
def city_intelligence(_user=Depends(require_roles(ALLOWED_ROLES))):
    return get_city_intelligence()


@router.post("/allocation/simulate")
def allocation_simulate(
    payload: CapitalAllocationSimInput,
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    result = simulate_allocation(
        AllocationInput(
            target_irr=payload.target_irr,
            max_ltv=payload.max_ltv,
            risk_tolerance=payload.risk_tolerance,
            holding_period_years=payload.holding_period_years,
            sector_targets=payload.sector_targets,
            total_capital_cr=payload.total_capital_cr,
        )
    )
    return result


@router.post("/risk/downside")
def risk_downside(
    payload: DownsideModelInput,
    _user=Depends(require_roles(ALLOWED_ROLES)),
):
    return downside_probability(
        DownsideInput(
            revenue_shock_pct=payload.revenue_shock_pct,
            rate_shock_bps=payload.rate_shock_bps,
            cap_rate_expansion_bps=payload.cap_rate_expansion_bps,
            liquidity_contraction_pct=payload.liquidity_contraction_pct,
            base_default_probability_pct=payload.base_default_probability_pct,
        )
    )


@router.get("/developers/intelligence")
def developer_intelligence(_user=Depends(require_roles(ALLOWED_ROLES))):
    return get_developer_intelligence()


@router.post("/ic/memo")
def ic_memo(payload: ICMemoInput, _user=Depends(require_roles(ALLOWED_ROLES))):
    downside = downside_probability(
        DownsideInput(
            revenue_shock_pct=payload.downside.revenue_shock_pct,
            rate_shock_bps=payload.downside.rate_shock_bps,
            cap_rate_expansion_bps=payload.downside.cap_rate_expansion_bps,
            liquidity_contraction_pct=payload.downside.liquidity_contraction_pct,
            base_default_probability_pct=payload.downside.base_default_probability_pct,
        )
    )
    return generate_ic_memo(
        deal_name=payload.deal_name,
        city=payload.city,
        micro_market=payload.micro_market,
        target_equity_cr=payload.target_equity_cr,
        scenario=downside,
    )


@router.get("/macro/overview")
def macro_overview(_user=Depends(require_roles(ALLOWED_ROLES))):
    return get_macro_credit_overview()

