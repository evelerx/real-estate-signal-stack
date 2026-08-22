from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    load_dotenv = None

from config import VALID_SNAPSHOTS
from schemas.area import AreaSnapshotResponse

from routes.auth import router as auth_router
from routes.staff import router as staff_router
from routes.intel import router as intel_router
from routes.enterprise import router as enterprise_router
from routes.investor_dashboard import router as investor_dashboard_router
from routes.openrouter import router as openrouter_router
from routes.public import router as public_router
from services.analyst_admin import router as analyst_router
from services.analyst_admin import ANALYST_ADJUSTMENTS
from services.db import init_db

from services.risk_service import compute_total_risk_deductions
from services.macro_service import compute_city_macro_score
from core.geo_data import build_area_data, build_area_access
from services.area_adjustment_service import compute_area_adjustment
from services.analyst_adjustment_service import compute_analyst_adjustment
from services.allocation_map_service import map_bucket
from services.ml_methodology import (
    audit_model_contract,
    compute_area_model,
    get_model_methodology,
    get_project_traceability,
)
from services.wakad_external_service import (
    fetch_wakad_heatmap,
    fetch_wakad_snapshot,
    fetch_wakad_timeseries,
)

if load_dotenv:
    load_dotenv()

# =========================================================
# APP INIT
# =========================================================

app = FastAPI(title="Real Estate Signal Stack")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyst_router)
app.include_router(staff_router)
app.include_router(intel_router)
app.include_router(investor_dashboard_router)
app.include_router(enterprise_router)
app.include_router(openrouter_router)
app.include_router(public_router)

# =========================================================
# CONFIDENCE CONFIG
# =========================================================

CONFIDENCE_OVERRIDE_WEIGHT = 20.0
CONFIDENCE_TIME_DECAY = 3.0
CONFIDENCE_RISK_WEIGHT = 0.5
CONFIDENCE_OVERRIDE_FREQUENCY = 5.0

# =========================================================
# TEMP DATA (IN-MEMORY)
# =========================================================

AREA_DATA = build_area_data()
AREA_ACCESS = build_area_access(AREA_DATA)

DATA_PROVENANCE = {
    "sources": [
        "Google Maps Distance Matrix",
        "MahaRERA",
        "MIDC Maharashtra",
        "MoHUA Infrastructure Dashboards",
    ],
    "update_frequency": "Quarterly",
    "last_updated": "2024-12-31",
}

WAKAD_AREA_KEY = "wakad"

# =========================================================
# HELPERS
# =========================================================

def compute_area_base_score(
    connectivity: int,
    infrastructure: int,
    builder_reliability: int,
    supply_pressure: int,
    search_heat: int,
) -> float:
    return round(
        connectivity * 0.25
        + infrastructure * 0.20
        + builder_reliability * 0.20
        + (100 - supply_pressure) * 0.20
        + search_heat * 0.15,
        2,
    )


def compute_confidence(
    analyst_delta: float,
    total_risk_deduction: float,
    override_age_quarters: int,
    recent_override_count: int,
) -> float:
    confidence = 100.0
    confidence -= abs(analyst_delta) * CONFIDENCE_OVERRIDE_WEIGHT
    confidence -= total_risk_deduction * CONFIDENCE_RISK_WEIGHT
    confidence -= override_age_quarters * CONFIDENCE_TIME_DECAY
    confidence -= recent_override_count * CONFIDENCE_OVERRIDE_FREQUENCY
    return round(max(0.0, min(confidence, 100.0)), 2)


def is_wakad(area_name: str | None) -> bool:
    return (area_name or "").strip().lower() == WAKAD_AREA_KEY

# =========================================================
# ROUTES
# =========================================================

@app.get("/ping")
def ping():
    return {"pong": True}


@app.get("/")
def root():
    return {"status": "Real Estate Signal Stack running"}


@app.get("/model/methodology")
def model_methodology():
    return get_model_methodology()


@app.get("/model/audit")
def model_audit():
    return audit_model_contract(AREA_DATA.values())


@app.get("/model/traceability")
def model_traceability():
    return get_project_traceability()

# ---------------- CITY MACRO ----------------

@app.get("/cities/{city_id}/macro")
def get_city_macro(city_id: str):
    return compute_city_macro_score(city_id.lower())

# ---------------- AREA SNAPSHOT ----------------

@app.get("/areas/{area_id}", response_model=AreaSnapshotResponse)
def get_area_snapshot(
    area_id: str,
    version: Optional[str] = Query(None),
    live_data_api_key: Optional[str] = Header(None, alias="X-Live-Data-Api-Key"),
):
    if not VALID_SNAPSHOTS:
        raise HTTPException(status_code=500, detail="No snapshots configured")

    if version is None:
        version = sorted(VALID_SNAPSHOTS.keys())[-1]

    if version not in VALID_SNAPSHOTS:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    area_key = area_id.lower()
    area = AREA_DATA.get(area_key)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    access = AREA_ACCESS.get(area_key, {"tier": "unknown", "unlocked": False})

    macro = compute_city_macro_score(area["city"].lower())
    macro_score = macro.get("score", 0.0)

    # ✅ FIXED: explicit args (NO **area)
    base_score = compute_area_base_score(
        connectivity=area["connectivity"],
        infrastructure=area["infrastructure"],
        builder_reliability=area["builder_reliability"],
        supply_pressure=area["supply_pressure"],
        search_heat=area["search_heat"],
    )

    area_adj = compute_area_adjustment(area)
    analyst_adj = compute_analyst_adjustment(area_key, version)

    analyst_delta = analyst_adj.get("analyst_adjustment_delta", 0.0)
    area_factor = area_adj.get("adjustment_factor", 1.0)

    final_adjustment_factor = area_factor + analyst_delta

    risk = compute_total_risk_deductions(
        builder_data=[{
            "execution_score": area["builder_reliability"],
            "area_project_share": 1.0,
        }],
        manual_builder_decay="MEDIUM",
    )

    total_risk = risk.get("total_deduction", 0.0)

    final_score = max(base_score * final_adjustment_factor - total_risk, 0.0)
    ml_model = compute_area_model(
        area,
        adjustment_factor=final_adjustment_factor,
        analyst_delta=analyst_delta,
        risk_deduction=total_risk,
    )

    confidence = compute_confidence(
        analyst_delta,
        total_risk,
        analyst_adj.get("override_age_quarters", 0),
        analyst_adj.get("recent_override_count", 0),
    )

    response = {
        "area": area_id.capitalize(),
        "city": area["city"],
        "snapshot_version": version,
        "tier": access["tier"],
        "status": "unlocked" if access["unlocked"] else "locked",
        "capital_allocation_score": round(final_score, 2),
        "allocation_signal": map_bucket(final_score),
        "score_composition": {
            "city_macro_score": macro_score,
            "base_area_score": base_score,
            "ml_adjusted_area_score": ml_model.score,
            "risk_probability_pct": ml_model.risk_probability_pct,
            "ml_confidence_score": ml_model.confidence_score,
            "normalized_features": ml_model.normalized_features,
            "model_formula": ml_model.formula,
            "area_adjustment_factor": area_factor,
            "analyst_adjustment_delta": analyst_delta,
            "final_adjustment_factor": final_adjustment_factor,
            "risk_deductions": risk,
        },
        "data_provenance": DATA_PROVENANCE,
    }

    if is_wakad(area_key):
        try:
            external = fetch_wakad_snapshot(api_key=live_data_api_key)
            if "capital_allocation_score" in external:
                response["capital_allocation_score"] = round(
                    float(external["capital_allocation_score"]), 2
                )
            if "allocation_signal" in external:
                if isinstance(external["allocation_signal"], dict):
                    response["allocation_signal"] = external["allocation_signal"]
                elif isinstance(external["allocation_signal"], str):
                    response["allocation_signal"] = {
                        "bucket": response["allocation_signal"]["bucket"],
                        "signal": external["allocation_signal"],
                    }
            if "snapshot_version" in external:
                response["snapshot_version"] = str(external["snapshot_version"])
            response["data_provenance"] = external.get(
                "data_provenance",
                {
                    "sources": ["External Wakad Provider"],
                    "update_frequency": "Provider Defined",
                    "last_updated": "Provider Defined",
                },
            )
        except (ValueError, RuntimeError):
            # Fall back to local computed data when external Wakad feed is unavailable.
            pass

    return response

# ---------------- TIME SERIES ----------------

@app.get("/areas/timeseries")
def get_area_timeseries(
    area: str = Query(...),
    live_data_api_key: Optional[str] = Header(None, alias="X-Live-Data-Api-Key"),
):
    area_key = area.strip().lower()
    if is_wakad(area_key):
        try:
            return fetch_wakad_timeseries(api_key=live_data_api_key)
        except (ValueError, RuntimeError):
            # Fall back to local computed data when external Wakad feed is unavailable.
            pass

    area_data = AREA_DATA.get(area_key)
    if not area_data:
        # Fall back to a default series instead of a hard 404 in dev
        area_key = next(iter(AREA_DATA.keys()))
        area_data = AREA_DATA[area_key]

    base = compute_area_base_score(
        connectivity=area_data["connectivity"],
        infrastructure=area_data["infrastructure"],
        builder_reliability=area_data["builder_reliability"],
        supply_pressure=area_data["supply_pressure"],
        search_heat=area_data["search_heat"],
    )

    quarters = [
        "2024-Q1",
        "2024-Q2",
        "2024-Q3",
        "2024-Q4",
        "2025-Q1",
        "2025-Q2",
        "2025-Q3",
        "2025-Q4",
    ]

    series = []
    for idx, q in enumerate(quarters):
        drift = (idx - 3.5) * 0.8
        score = max(0.0, min(100.0, base + drift))
        confidence = max(55.0, min(98.0, 82.0 + (base - 70) / 3 - idx * 0.4))
        risk = max(0.0, min(100.0, 100.0 - score - 15.0))
        series.append(
            {
                "quarter": q,
                "score": round(score, 2),
                "confidence": round(confidence, 2),
                "risk": round(risk, 2),
            }
        )

    return series


@app.get("/timeseries/areas")
def get_area_timeseries_alias(
    area: str = Query(...),
    live_data_api_key: Optional[str] = Header(None, alias="X-Live-Data-Api-Key"),
):
    return get_area_timeseries(area=area, live_data_api_key=live_data_api_key)

# ---------------- HEATMAP ----------------

@app.get("/heatmap/areas")
def get_area_heatmap(
    city: Optional[str] = None,
    state: Optional[str] = None,
    area: Optional[str] = None,
    live_data_api_key: Optional[str] = Header(None, alias="X-Live-Data-Api-Key"),
    live_data_provider: Optional[str] = Header(None, alias="X-Live-Data-Provider"),
):
    provider = (live_data_provider or "").strip().lower()
    use_live_provider = provider == "custom_market_data" and bool(live_data_api_key)

    if is_wakad(area) or use_live_provider:
        try:
            live_rows = fetch_wakad_heatmap(api_key=live_data_api_key)
            for row in live_rows:
                row["data_source"] = "live_provider"
            return live_rows
        except (ValueError, RuntimeError):
            # The dashboard stays available with its model baseline if the provider is unavailable.
            pass

    results = []

    for key, area in AREA_DATA.items():
        if city and area["city"].lower() != city.lower():
            continue
        if state and area["state"].lower() != state.lower():
            continue

        score = compute_area_base_score(
            connectivity=area["connectivity"],
            infrastructure=area["infrastructure"],
            builder_reliability=area["builder_reliability"],
            supply_pressure=area["supply_pressure"],
            search_heat=area["search_heat"],
        )

        results.append({
            "id": key,
            "name": key.capitalize(),
            "score": score,
            "city": area["city"],
            "state": area["state"],
            "data_source": "model_baseline",
        })

    return results


