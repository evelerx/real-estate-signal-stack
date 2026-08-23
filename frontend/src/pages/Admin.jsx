import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GeoSelector from "../components/GeoSelector";
import GoogleProgrammableSearch from "../components/GoogleProgrammableSearch";
import { useAuth } from "../context/AuthContext";
import { loginStaff } from "../services/staffApi";
import {
  addBrokerDeal,
  addListing,
  addValidation,
  loadIntelByArea,
  syncIntelByArea,
  getIntelByArea,
  removeBrokerDeal,
  removeListing,
  removeValidation,
  updateBrokerDeal,
  updateListing,
  updateValidation,
} from "../services/localIntel";
import {
  fetchCityIntelligenceInputs,
  fetchMicroMarketEngine,
  upsertCityIntelligenceInput,
  upsertMicroMarketInput,
} from "../services/cityIntelApi";
import {
  fetchDeveloperIntelligenceLayer,
  upsertDeveloperIntelligenceManual,
} from "../services/developerIntelApi";
import {
  fetchDealSurvivalLayer,
  upsertDealSurvivalManual,
} from "../services/dealSurvivalApi";
import {
  clearLiveDataConfig,
  getLiveDataConfig,
  saveLiveDataConfig,
} from "../services/liveDataConfig";
import {
  clearOpenRouterConfig,
  fetchOpenRouterKeyStatus,
  getOpenRouterConfig,
  saveOpenRouterConfig,
  testOpenRouterConnection,
} from "../services/openRouterConfig";
import {
  clearGoogleDataConfig,
  getGoogleDataConfig,
  saveGoogleDataConfig,
  verifyGoogleDataConfig,
} from "../services/googleDataConfig";
import {
  fetchModelAudit,
  fetchModelMethodology,
  fetchModelTraceability,
} from "../services/modelApi";

const ROLE_LABELS = {
  admin: "Admin",
};

const CITY_INTELLIGENCE_CITIES = [
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "NCR",
  "Chennai",
];

const MICRO_MARKET_OPTIONS = {
  Mumbai: ["BKC"],
  Pune: ["Wakad"],
  Bengaluru: ["Whitefield"],
  Hyderabad: ["Gachibowli"],
  NCR: ["Gurugram Golf Course Road"],
  Chennai: ["OMR"],
};

const DEVELOPER_OPTIONS = [
  "Godrej Properties",
  "Lodha",
  "Prestige Group",
  "Sobha",
];

const DEAL_OPTIONS = [
  "Pune Wakad Rental Income Fund",
  "Mumbai BKC Grade A Office Core",
  "Hyderabad Gachibowli Flex Campus",
];

const MICRO_MARKET_MANUAL_FIELDS = [
  {
    key: "price_psf_3y_ago",
    label: "Price PSF 3Y Ago",
    hint: "Historic baseline value from 3 years ago.",
    step: "0.1",
  },
  {
    key: "price_psf_2y_ago",
    label: "Price PSF 2Y Ago",
    hint: "Historic baseline value from 2 years ago.",
    step: "0.1",
  },
  {
    key: "price_psf_1y_ago",
    label: "Price PSF 1Y Ago",
    hint: "Historic baseline value from 1 year ago.",
    step: "0.1",
  },
  {
    key: "price_psf_current",
    label: "Price PSF Current",
    hint: "Current average transacted price per sq ft.",
    step: "0.1",
  },
  {
    key: "rental_yield_pct",
    label: "Rental Yield (%)",
    hint: "Gross annual yield percentage.",
    step: "0.1",
  },
  {
    key: "units_under_construction",
    label: "Units Under Construction",
    hint: "Current live supply pipeline in units.",
    step: "1",
  },
  {
    key: "months_of_inventory",
    label: "Months of Inventory",
    hint: "How long current inventory takes to clear at current pace.",
    step: "0.1",
  },
  {
    key: "absorption_rate_pct",
    label: "Absorption Rate (%)",
    hint: "Share of available supply absorbed in period.",
    step: "0.1",
  },
  {
    key: "developer_concentration_pct",
    label: "Developer Concentration (%)",
    hint: "Market share held by top developers in this micro-market.",
    step: "0.1",
  },
  {
    key: "land_price_movement_3y_pct",
    label: "Land Price Movement 3Y (%)",
    hint: "Cumulative land-price move over 3 years.",
    step: "0.1",
  },
  {
    key: "transaction_depth_index",
    label: "Transaction Depth Index",
    hint: "Liquidity proxy index; higher generally means deeper market.",
    step: "0.1",
  },
];

const DEVELOPER_MANUAL_FIELDS = [
  {
    key: "manual_balance_sheet_leverage_ratio",
    label: "Balance Sheet Leverage Ratio",
    hint: "Debt-to-equity style leverage ratio (example: 0.45).",
    step: "0.01",
  },
  {
    key: "manual_past_investor_outcome_score",
    label: "Past Investor Outcome Score (0-100)",
    hint: "Higher means stronger historical investor outcomes.",
    step: "0.1",
  },
];

const DEAL_SURVIVAL_MANUAL_FIELDS = [
  {
    key: "manual_purchase_price_cr",
    label: "Purchase Price (Cr)",
    hint: "Acquisition value in INR crore.",
    step: "0.1",
  },
  {
    key: "manual_replacement_cost_cr",
    label: "Replacement Cost (Cr)",
    hint: "Estimated rebuild/replacement value in INR crore.",
    step: "0.1",
  },
  {
    key: "manual_ltv_pct",
    label: "LTV (%)",
    hint: "Loan-to-value percentage.",
    step: "0.1",
  },
  {
    key: "manual_dscr",
    label: "DSCR",
    hint: "Debt service coverage ratio (example: 1.30).",
    step: "0.01",
  },
  {
    key: "manual_break_even_occupancy_pct",
    label: "Break-even Occupancy (%)",
    hint: "Occupancy required to service obligations.",
    step: "0.1",
  },
  {
    key: "manual_revenue_stress_10_pct",
    label: "Revenue Stress at -10% Scenario",
    hint: "Impact metric under a 10% revenue shock (typically negative).",
    step: "0.1",
  },
  {
    key: "manual_revenue_stress_15_pct",
    label: "Revenue Stress at -15% Scenario",
    hint: "Impact metric under a 15% revenue shock (typically negative).",
    step: "0.1",
  },
  {
    key: "manual_exit_cap_stress_bps",
    label: "Exit Cap Stress (bps)",
    hint: "Cap rate expansion stress in basis points.",
    step: "0.1",
  },
];

const CITY_INTELLIGENCE_FIELDS = [
  {
    key: "employment_growth_services_pct",
    label: "Employment Growth - Services (%)",
    hint: "Annual services employment growth rate.",
    step: "0.1",
  },
  {
    key: "employment_growth_manufacturing_pct",
    label: "Employment Growth - Manufacturing (%)",
    hint: "Annual manufacturing employment growth rate.",
    step: "0.1",
  },
  {
    key: "office_absorption_msf",
    label: "Office Absorption (MSF)",
    hint: "Net office absorption in million sq ft.",
    step: "0.1",
  },
  {
    key: "it_expansion_index",
    label: "IT Expansion Index",
    hint: "City-level IT growth proxy index.",
    step: "0.1",
  },
  {
    key: "manufacturing_expansion_index",
    label: "Manufacturing Expansion Index",
    hint: "City-level manufacturing growth proxy index.",
    step: "0.1",
  },
  {
    key: "migration_inflow_k",
    label: "Migration Inflow (k)",
    hint: "Net migration inflow in thousands.",
    step: "0.1",
  },
  {
    key: "infrastructure_project_index",
    label: "Infrastructure Project Index",
    hint: "Composite index for infra progress and delivery.",
    step: "0.1",
  },
  {
    key: "residential_price_cagr_5y_pct",
    label: "Residential Price CAGR 5Y (%)",
    hint: "5-year residential price compound growth rate.",
    step: "0.1",
  },
  {
    key: "residential_price_cagr_10y_pct",
    label: "Residential Price CAGR 10Y (%)",
    hint: "10-year residential price compound growth rate.",
    step: "0.1",
  },
  {
    key: "rental_yield_pct",
    label: "Rental Yield (%)",
    hint: "Gross annual rental yield.",
    step: "0.1",
  },
  {
    key: "rental_yield_trend_bps",
    label: "Rental Yield Trend (bps)",
    hint: "Yield trend change in basis points.",
    step: "0.1",
  },
  {
    key: "transaction_volume_cr",
    label: "Transaction Volume (Cr)",
    hint: "Total transaction value in INR crore.",
    step: "0.1",
  },
  {
    key: "units_under_construction",
    label: "Units Under Construction",
    hint: "Current supply pipeline in units.",
    step: "1",
  },
];

function makeCityForm(city = "Mumbai") {
  return {
    city,
    employment_growth_services_pct: "",
    employment_growth_manufacturing_pct: "",
    office_absorption_msf: "",
    it_expansion_index: "",
    manufacturing_expansion_index: "",
    migration_inflow_k: "",
    infrastructure_project_index: "",
    residential_price_cagr_5y_pct: "",
    residential_price_cagr_10y_pct: "",
    rental_yield_pct: "",
    rental_yield_trend_bps: "",
    transaction_volume_cr: "",
    units_under_construction: "",
  };
}

function makeMicroForm(city = "Mumbai", market = "BKC") {
  return {
    city,
    micro_market: market,
    price_psf_3y_ago: "",
    price_psf_2y_ago: "",
    price_psf_1y_ago: "",
    price_psf_current: "",
    rental_yield_pct: "",
    units_under_construction: "",
    months_of_inventory: "",
    absorption_rate_pct: "",
    developer_concentration_pct: "",
    land_price_movement_3y_pct: "",
    transaction_depth_index: "",
  };
}

function makeDeveloperForm(name = "Godrej Properties") {
  return {
    developer_name: name,
    manual_balance_sheet_leverage_ratio: "",
    manual_past_investor_outcome_score: "",
  };
}

function makeDealForm(name = "Pune Wakad Rental Income Fund") {
  return {
    deal_name: name,
    manual_purchase_price_cr: "",
    manual_replacement_cost_cr: "",
    manual_ltv_pct: "",
    manual_dscr: "",
    manual_break_even_occupancy_pct: "",
    manual_revenue_stress_10_pct: "",
    manual_revenue_stress_15_pct: "",
    manual_exit_cap_stress_bps: "",
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const { role, accessToken, isAuthenticated, login, logout } = useAuth();

  const [loginForm, setLoginForm] = useState({
    error: "",
    loading: false,
  });

  const [selection, setSelection] = useState({
    country: "India",
    state: null,
    city: null,
    area: null,
  });

  const [listingForm, setListingForm] = useState({
    company: "",
    project: "",
    stage: "",
    priceRange: "",
  });

  const [dealForm, setDealForm] = useState({
    broker: "",
    asset: "",
    status: "",
    price: "",
    notes: "",
  });

  const [validationForm, setValidationForm] = useState({
    summary: "",
    trend: "",
    confidence: "",
    source: "",
  });

  const [areaIntel, setAreaIntel] = useState(null);
  const [cityIntelRows, setCityIntelRows] = useState([]);
  const [cityIntelError, setCityIntelError] = useState("");
  const [cityForm, setCityForm] = useState(makeCityForm());
  const [microRows, setMicroRows] = useState([]);
  const [microError, setMicroError] = useState("");
  const [microForm, setMicroForm] = useState(makeMicroForm());
  const [developerRows, setDeveloperRows] = useState([]);
  const [developerError, setDeveloperError] = useState("");
  const [developerForm, setDeveloperForm] = useState(makeDeveloperForm());
  const [dealSurvivalRows, setDealSurvivalRows] = useState([]);
  const [dealSurvivalError, setDealSurvivalError] = useState("");
  const [dealSurvivalForm, setDealSurvivalForm] = useState(makeDealForm());
  const [liveApiForm, setLiveApiForm] = useState(() => getLiveDataConfig());
  const [liveApiMessage, setLiveApiMessage] = useState("");
  const [openRouterForm, setOpenRouterForm] = useState(() => getOpenRouterConfig());
  const [openRouterMessage, setOpenRouterMessage] = useState("");
  const [googleDataForm, setGoogleDataForm] = useState(() => getGoogleDataConfig());
  const [googleDataMessage, setGoogleDataMessage] = useState("");
  const [modelMethodology, setModelMethodology] = useState(null);
  const [modelAudit, setModelAudit] = useState(null);
  const [modelTraceability, setModelTraceability] = useState(null);
  const [modelError, setModelError] = useState("");

  const canManageAll = true;
  const canManageData = true;
  const canManageGeneral = true;
  const canViewData = true;

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function scrollToId(targetId) {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleLiveApiSubmit(e) {
    e.preventDefault();
    const saved = saveLiveDataConfig(liveApiForm);
    setLiveApiForm(saved);
    setLiveApiMessage(
      saved.enabled
        ? "Live data API key saved. Graphs will refresh every 30 seconds only while open."
        : "API key saved but live mode is disabled."
    );
  }

  function handleClearLiveApi() {
    const cleared = clearLiveDataConfig();
    setLiveApiForm(cleared);
    setLiveApiMessage("Live data API key removed from this browser.");
  }

  async function handleGoogleDataSubmit(e) {
    e.preventDefault();
    const saved = saveGoogleDataConfig(googleDataForm);
    setGoogleDataForm(saved);
    if (!saved.enabled) {
      setGoogleDataMessage("Google credentials saved but disabled or incomplete.");
      return;
    }
    setGoogleDataMessage("Credentials saved. Testing Google connections...");
    try {
      const result = await verifyGoogleDataConfig(accessToken);
      setGoogleDataMessage(`Connected: Places ${result.places}, Routes ${result.routes}, Search ${result.programmable_search}.`);
    } catch (err) {
      setGoogleDataMessage(err.message || "Google API verification failed.");
    }
  }

  function handleClearGoogleData() {
    const cleared = clearGoogleDataConfig();
    setGoogleDataForm(cleared);
    setGoogleDataMessage("Google credentials removed from this browser.");
  }

  async function handleGoogleDataVerify() {
    try {
      const result = await verifyGoogleDataConfig(accessToken);
      setGoogleDataMessage(`Connected: Places ${result.places}, Routes ${result.routes}, Search ${result.programmable_search}.`);
    } catch (err) {
      setGoogleDataMessage(err.message || "Google API verification failed.");
    }
  }

  async function handleOpenRouterSubmit(e) {
    e.preventDefault();
    const saved = saveOpenRouterConfig({
      ...openRouterForm,
      usageLimitUsd: 0.008,
    });
    setOpenRouterForm(saved);
    if (!saved.enabled) {
      setOpenRouterMessage("OpenRouter key saved but disabled.");
      return;
    }
    setOpenRouterMessage("Key saved. Verifying the connection...");
    try {
      const status = await fetchOpenRouterKeyStatus(accessToken);
      const remaining = status.limit_remaining === null || status.limit_remaining === undefined
        ? "not set"
        : `$${Number(status.limit_remaining).toFixed(4)}`;
      setOpenRouterMessage(`Key verified. OpenRouter remaining limit: ${remaining}. Local project cap: $0.0080.`);
    } catch (err) {
      setOpenRouterMessage(`Key saved locally, but verification failed: ${err.message || "Unknown error"}`);
    }
  }

  function handleClearOpenRouter() {
    const cleared = clearOpenRouterConfig();
    setOpenRouterForm(cleared);
    setOpenRouterMessage("OpenRouter key removed from this browser.");
  }

  async function handleOpenRouterStatus() {
    if (!accessToken) return;
    try {
      const status = await fetchOpenRouterKeyStatus(accessToken);
      const remaining =
        status.limit_remaining === null || status.limit_remaining === undefined
          ? "not set"
          : `$${Number(status.limit_remaining).toFixed(4)}`;
      setOpenRouterMessage(
        `Key reachable. OpenRouter remaining limit: ${remaining}. Local project cap: $0.0080.`
      );
    } catch (err) {
      setOpenRouterMessage(err.message || "Could not verify OpenRouter key.");
    }
  }

  async function handleOpenRouterTest() {
    if (!accessToken) return;
    setOpenRouterMessage("Sending a small capped test request...");
    try {
      const result = await testOpenRouterConnection(accessToken);
      const cost = result.cost === null ? "provider did not report cost" : `$${result.cost.toFixed(6)}`;
      setOpenRouterMessage(`AI test succeeded: ${result.text} Cost: ${cost}.`);
    } catch (err) {
      setOpenRouterMessage(err.message || "OpenRouter test request failed.");
    }
  }

  async function refreshModelEvidence() {
    try {
      setModelError("");
      const [methodology, audit, traceability] = await Promise.all([
        fetchModelMethodology(),
        fetchModelAudit(),
        fetchModelTraceability(),
      ]);
      setModelMethodology(methodology);
      setModelAudit(audit);
      setModelTraceability(traceability);
    } catch (err) {
      setModelError(err.message || "Failed to load model evidence");
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    try {
      setLoginForm((prev) => ({ ...prev, loading: true, error: "" }));
      const tokens = await loginStaff();
      login(tokens);
      setLoginForm({ error: "", loading: false });
    } catch (err) {
      setLoginForm((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Login failed",
      }));
    }
  }

  function handleListingChange(e) {
    setListingForm({ ...listingForm, [e.target.name]: e.target.value });
  }

  function handleDealChange(e) {
    setDealForm({ ...dealForm, [e.target.name]: e.target.value });
  }

  function handleValidationChange(e) {
    setValidationForm({ ...validationForm, [e.target.name]: e.target.value });
  }

  async function refreshAreaIntel(areaName = selection.area) {
    if (!areaName) {
      setAreaIntel(null);
      return;
    }
    const intel = await loadIntelByArea(areaName, accessToken);
    setAreaIntel(intel);
  }

  async function persistIntel(areaName = selection.area) {
    if (!areaName) return;
    await syncIntelByArea(areaName, accessToken);
    await refreshAreaIntel(areaName);
  }

  async function handleSubmitListing(e) {
    e.preventDefault();
    if (!selection.area) return;

    addListing({ area: selection.area, ...listingForm });
    await persistIntel(selection.area);
    setListingForm({ company: "", project: "", stage: "", priceRange: "" });
  }

  async function handleSubmitDeal(e) {
    e.preventDefault();
    if (!selection.area) return;

    addBrokerDeal({ area: selection.area, ...dealForm });
    await persistIntel(selection.area);
    setDealForm({ broker: "", asset: "", status: "", price: "", notes: "" });
  }

  async function handleSubmitValidation(e) {
    e.preventDefault();
    if (!selection.area) return;

    addValidation({ area: selection.area, ...validationForm });
    await persistIntel(selection.area);
    setValidationForm({ summary: "", trend: "", confidence: "", source: "" });
  }

  async function handleListingUpdate(index, field, value) {
    if (!selection.area) return;
    updateListing(selection.area, index, { [field]: value });
    await persistIntel(selection.area);
  }

  async function handleDealUpdate(index, field, value) {
    if (!selection.area) return;
    updateBrokerDeal(selection.area, index, { [field]: value });
    await persistIntel(selection.area);
  }

  async function handleValidationUpdate(index, field, value) {
    if (!selection.area) return;
    updateValidation(selection.area, index, { [field]: value });
    await persistIntel(selection.area);
  }

  async function refreshCityIntelligence() {
    if (!accessToken) return;
    const payload = await fetchCityIntelligenceInputs(accessToken);
    const rows = Array.isArray(payload?.cities) ? payload.cities : [];
    setCityIntelError("");
    setCityIntelRows(rows);
    if (!rows.length) return;
    setCityForm((prev) => {
      const current = rows.find((item) => item.city === prev.city) || rows[0];
      return {
        city: current.city,
        employment_growth_services_pct: current.employment_growth_services_pct ?? "",
        employment_growth_manufacturing_pct: current.employment_growth_manufacturing_pct ?? "",
        office_absorption_msf: current.office_absorption_msf ?? "",
        it_expansion_index: current.it_expansion_index ?? "",
        manufacturing_expansion_index: current.manufacturing_expansion_index ?? "",
        migration_inflow_k: current.migration_inflow_k ?? "",
        infrastructure_project_index: current.infrastructure_project_index ?? "",
        residential_price_cagr_5y_pct: current.residential_price_cagr_5y_pct ?? "",
        residential_price_cagr_10y_pct: current.residential_price_cagr_10y_pct ?? "",
        rental_yield_pct: current.rental_yield_pct ?? "",
        rental_yield_trend_bps: current.rental_yield_trend_bps ?? "",
        transaction_volume_cr: current.transaction_volume_cr ?? "",
        units_under_construction: current.units_under_construction ?? "",
      };
    });
  }

  function handleCitySelection(nextCity) {
    setCityForm(() => {
      const existing = cityIntelRows.find((item) => item.city === nextCity);
      if (!existing) return makeCityForm(nextCity);
      return {
        city: existing.city,
        employment_growth_services_pct: existing.employment_growth_services_pct ?? "",
        employment_growth_manufacturing_pct: existing.employment_growth_manufacturing_pct ?? "",
        office_absorption_msf: existing.office_absorption_msf ?? "",
        it_expansion_index: existing.it_expansion_index ?? "",
        manufacturing_expansion_index: existing.manufacturing_expansion_index ?? "",
        migration_inflow_k: existing.migration_inflow_k ?? "",
        infrastructure_project_index: existing.infrastructure_project_index ?? "",
        residential_price_cagr_5y_pct: existing.residential_price_cagr_5y_pct ?? "",
        residential_price_cagr_10y_pct: existing.residential_price_cagr_10y_pct ?? "",
        rental_yield_pct: existing.rental_yield_pct ?? "",
        rental_yield_trend_bps: existing.rental_yield_trend_bps ?? "",
        transaction_volume_cr: existing.transaction_volume_cr ?? "",
        units_under_construction: existing.units_under_construction ?? "",
      };
    });
  }

  async function handleCityIntelligenceSubmit(e) {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setCityIntelError("");
      await upsertCityIntelligenceInput(accessToken, cityForm.city, {
        city: cityForm.city,
        employment_growth_services_pct: toNumber(cityForm.employment_growth_services_pct),
        employment_growth_manufacturing_pct: toNumber(cityForm.employment_growth_manufacturing_pct),
        office_absorption_msf: toNumber(cityForm.office_absorption_msf),
        it_expansion_index: toNumber(cityForm.it_expansion_index),
        manufacturing_expansion_index: toNumber(cityForm.manufacturing_expansion_index),
        migration_inflow_k: toNumber(cityForm.migration_inflow_k),
        infrastructure_project_index: toNumber(cityForm.infrastructure_project_index),
        residential_price_cagr_5y_pct: toNumber(cityForm.residential_price_cagr_5y_pct),
        residential_price_cagr_10y_pct: toNumber(cityForm.residential_price_cagr_10y_pct),
        rental_yield_pct: toNumber(cityForm.rental_yield_pct),
        rental_yield_trend_bps: toNumber(cityForm.rental_yield_trend_bps),
        transaction_volume_cr: toNumber(cityForm.transaction_volume_cr),
        units_under_construction: toNumber(cityForm.units_under_construction),
      });
      await refreshCityIntelligence();
    } catch (err) {
      setCityIntelError(err.message || "Failed to save city intelligence");
    }
  }

  async function refreshMicroMarkets() {
    if (!accessToken) return;
    const payload = await fetchMicroMarketEngine(accessToken);
    const rows = Array.isArray(payload?.micro_markets) ? payload.micro_markets : [];
    setMicroError("");
    setMicroRows(rows);
    if (!rows.length) return;
    setMicroForm((prev) => {
      const current =
        rows.find(
          (item) =>
            item.city === prev.city &&
            item.micro_market === prev.micro_market
        ) || rows[0];
      return {
        city: current.city,
        micro_market: current.micro_market,
        price_psf_3y_ago: current.price_psf_3y_ago ?? "",
        price_psf_2y_ago: current.price_psf_2y_ago ?? "",
        price_psf_1y_ago: current.price_psf_1y_ago ?? "",
        price_psf_current: current.price_psf_current ?? "",
        rental_yield_pct: current.rental_yield_pct ?? "",
        units_under_construction: current.units_under_construction ?? "",
        months_of_inventory: current.months_of_inventory ?? "",
        absorption_rate_pct: current.absorption_rate_pct ?? "",
        developer_concentration_pct: current.developer_concentration_pct ?? "",
        land_price_movement_3y_pct: current.land_price_movement_3y_pct ?? "",
        transaction_depth_index: current.transaction_depth_index ?? "",
      };
    });
  }

  function handleMicroCityChange(nextCity) {
    const market = MICRO_MARKET_OPTIONS[nextCity]?.[0] || "";
    const existing = microRows.find(
      (item) => item.city === nextCity && item.micro_market === market
    );
    if (!existing) {
      setMicroForm(makeMicroForm(nextCity, market));
      return;
    }
    setMicroForm({
      city: existing.city,
      micro_market: existing.micro_market,
      price_psf_3y_ago: existing.price_psf_3y_ago ?? "",
      price_psf_2y_ago: existing.price_psf_2y_ago ?? "",
      price_psf_1y_ago: existing.price_psf_1y_ago ?? "",
      price_psf_current: existing.price_psf_current ?? "",
      rental_yield_pct: existing.rental_yield_pct ?? "",
      units_under_construction: existing.units_under_construction ?? "",
      months_of_inventory: existing.months_of_inventory ?? "",
      absorption_rate_pct: existing.absorption_rate_pct ?? "",
      developer_concentration_pct: existing.developer_concentration_pct ?? "",
      land_price_movement_3y_pct: existing.land_price_movement_3y_pct ?? "",
      transaction_depth_index: existing.transaction_depth_index ?? "",
    });
  }

  function handleMicroMarketChange(nextMarket) {
    const existing = microRows.find(
      (item) => item.city === microForm.city && item.micro_market === nextMarket
    );
    if (!existing) {
      setMicroForm(makeMicroForm(microForm.city, nextMarket));
      return;
    }
    setMicroForm({
      city: existing.city,
      micro_market: existing.micro_market,
      price_psf_3y_ago: existing.price_psf_3y_ago ?? "",
      price_psf_2y_ago: existing.price_psf_2y_ago ?? "",
      price_psf_1y_ago: existing.price_psf_1y_ago ?? "",
      price_psf_current: existing.price_psf_current ?? "",
      rental_yield_pct: existing.rental_yield_pct ?? "",
      units_under_construction: existing.units_under_construction ?? "",
      months_of_inventory: existing.months_of_inventory ?? "",
      absorption_rate_pct: existing.absorption_rate_pct ?? "",
      developer_concentration_pct: existing.developer_concentration_pct ?? "",
      land_price_movement_3y_pct: existing.land_price_movement_3y_pct ?? "",
      transaction_depth_index: existing.transaction_depth_index ?? "",
    });
  }

  async function handleMicroSubmit(e) {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setMicroError("");
      await upsertMicroMarketInput(
        accessToken,
        microForm.city,
        microForm.micro_market,
        {
          city: microForm.city,
          micro_market: microForm.micro_market,
          price_psf_3y_ago: toNumber(microForm.price_psf_3y_ago),
          price_psf_2y_ago: toNumber(microForm.price_psf_2y_ago),
          price_psf_1y_ago: toNumber(microForm.price_psf_1y_ago),
          price_psf_current: toNumber(microForm.price_psf_current),
          rental_yield_pct: toNumber(microForm.rental_yield_pct),
          units_under_construction: toNumber(microForm.units_under_construction),
          months_of_inventory: toNumber(microForm.months_of_inventory),
          absorption_rate_pct: toNumber(microForm.absorption_rate_pct),
          developer_concentration_pct: toNumber(microForm.developer_concentration_pct),
          land_price_movement_3y_pct: toNumber(microForm.land_price_movement_3y_pct),
          transaction_depth_index: toNumber(microForm.transaction_depth_index),
        }
      );
      await refreshMicroMarkets();
    } catch (err) {
      setMicroError(err.message || "Failed to save micro-market input");
    }
  }

  async function refreshDeveloperLayer() {
    if (!accessToken) return;
    const payload = await fetchDeveloperIntelligenceLayer(accessToken);
    const rows = Array.isArray(payload?.developers) ? payload.developers : [];
    setDeveloperError("");
    setDeveloperRows(rows);
    if (!rows.length) return;
    setDeveloperForm((prev) => {
      const current = rows.find((item) => item.developer_name === prev.developer_name) || rows[0];
      return {
        developer_name: current.developer_name,
        manual_balance_sheet_leverage_ratio: current.manual_balance_sheet_leverage_ratio ?? "",
        manual_past_investor_outcome_score: current.manual_past_investor_outcome_score ?? "",
      };
    });
  }

  function handleDeveloperSelection(nextDeveloper) {
    const current = developerRows.find((item) => item.developer_name === nextDeveloper);
    if (!current) {
      setDeveloperForm(makeDeveloperForm(nextDeveloper));
      return;
    }
    setDeveloperForm({
      developer_name: current.developer_name,
      manual_balance_sheet_leverage_ratio: current.manual_balance_sheet_leverage_ratio ?? "",
      manual_past_investor_outcome_score: current.manual_past_investor_outcome_score ?? "",
    });
  }

  async function handleDeveloperManualSubmit(e) {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setDeveloperError("");
      await upsertDeveloperIntelligenceManual(
        accessToken,
        developerForm.developer_name,
        {
          developer_name: developerForm.developer_name,
          manual_balance_sheet_leverage_ratio: toNumber(developerForm.manual_balance_sheet_leverage_ratio),
          manual_past_investor_outcome_score: toNumber(developerForm.manual_past_investor_outcome_score),
        }
      );
      await refreshDeveloperLayer();
    } catch (err) {
      setDeveloperError(err.message || "Failed to save developer intelligence");
    }
  }

  async function refreshDealSurvivalLayer() {
    if (!accessToken) return;
    const payload = await fetchDealSurvivalLayer(accessToken);
    const rows = Array.isArray(payload?.deals) ? payload.deals : [];
    setDealSurvivalError("");
    setDealSurvivalRows(rows);
    if (!rows.length) return;
    setDealSurvivalForm((prev) => {
      const current = rows.find((item) => item.deal_name === prev.deal_name) || rows[0];
      return {
        deal_name: current.deal_name,
        manual_purchase_price_cr: current.manual_purchase_price_cr ?? "",
        manual_replacement_cost_cr: current.manual_replacement_cost_cr ?? "",
        manual_ltv_pct: current.manual_ltv_pct ?? "",
        manual_dscr: current.manual_dscr ?? "",
        manual_break_even_occupancy_pct: current.manual_break_even_occupancy_pct ?? "",
        manual_revenue_stress_10_pct: current.manual_revenue_stress_10_pct ?? "",
        manual_revenue_stress_15_pct: current.manual_revenue_stress_15_pct ?? "",
        manual_exit_cap_stress_bps: current.manual_exit_cap_stress_bps ?? "",
      };
    });
  }

  function handleDealSurvivalSelection(nextDeal) {
    const current = dealSurvivalRows.find((item) => item.deal_name === nextDeal);
    if (!current) {
      setDealSurvivalForm(makeDealForm(nextDeal));
      return;
    }
    setDealSurvivalForm({
      deal_name: current.deal_name,
      manual_purchase_price_cr: current.manual_purchase_price_cr ?? "",
      manual_replacement_cost_cr: current.manual_replacement_cost_cr ?? "",
      manual_ltv_pct: current.manual_ltv_pct ?? "",
      manual_dscr: current.manual_dscr ?? "",
      manual_break_even_occupancy_pct: current.manual_break_even_occupancy_pct ?? "",
      manual_revenue_stress_10_pct: current.manual_revenue_stress_10_pct ?? "",
      manual_revenue_stress_15_pct: current.manual_revenue_stress_15_pct ?? "",
      manual_exit_cap_stress_bps: current.manual_exit_cap_stress_bps ?? "",
    });
  }

  async function handleDealSurvivalSubmit(e) {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setDealSurvivalError("");
      await upsertDealSurvivalManual(accessToken, dealSurvivalForm.deal_name, {
        deal_name: dealSurvivalForm.deal_name,
        manual_purchase_price_cr: toNumber(dealSurvivalForm.manual_purchase_price_cr),
        manual_replacement_cost_cr: toNumber(dealSurvivalForm.manual_replacement_cost_cr),
        manual_ltv_pct: toNumber(dealSurvivalForm.manual_ltv_pct),
        manual_dscr: toNumber(dealSurvivalForm.manual_dscr),
        manual_break_even_occupancy_pct: toNumber(dealSurvivalForm.manual_break_even_occupancy_pct),
        manual_revenue_stress_10_pct: toNumber(dealSurvivalForm.manual_revenue_stress_10_pct),
        manual_revenue_stress_15_pct: toNumber(dealSurvivalForm.manual_revenue_stress_15_pct),
        manual_exit_cap_stress_bps: toNumber(dealSurvivalForm.manual_exit_cap_stress_bps),
      });
      await refreshDealSurvivalLayer();
    } catch (err) {
      setDealSurvivalError(err.message || "Failed to save deal survival layer");
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    refreshModelEvidence();
    refreshCityIntelligence().catch((err) =>
      setCityIntelError(err?.message || "Failed to load city intelligence")
    );
    refreshMicroMarkets().catch((err) =>
      setMicroError(err?.message || "Failed to load micro-market engine")
    );
    refreshDeveloperLayer().catch((err) =>
      setDeveloperError(err?.message || "Failed to load developer intelligence")
    );
    refreshDealSurvivalLayer().catch((err) =>
      setDealSurvivalError(err?.message || "Failed to load deal survival layer")
    );
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    if (!selection.area) {
      setAreaIntel(null);
      return;
    }
    refreshAreaIntel(selection.area).catch(() =>
      setAreaIntel(getIntelByArea(selection.area))
    );
  }, [selection.area, accessToken]);


  return (
    <div className="page admin-page">
      <header className="site-header">
        <div className="header-shell">
          <div className="brand">
            <span className="brand-mark">A</span>
            <div>
              <p className="brand-title">Apex Signal Capital</p>
              <p className="brand-subtitle">Admin Intelligence Console</p>
            </div>
          </div>

          <nav className="nav">
            <a href="#overview">Overview</a>
            <a href="#features">Features</a>
            <a href="#access">Access</a>
            <a href="#tools">Tools</a>
            <a href="/pricing">Pricing</a>
          </nav>

          <div className="header-actions">
            <button className="btn ghost" onClick={() => navigate("/")}>
              Back to Home
            </button>
            <button className="btn primary" onClick={() => scrollToId("access")}>
              Request Access
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero admin-hero" id="overview">
          <div className="hero-shell">
            <div className="hero-content">
              <p className="eyebrow">Internal Operations</p>
              <h1>Admin access for real estate signal operations.</h1>
              <p className="lead">
                A secure workspace to curate listings, manage admin inputs, and
                validate market signals before they reach clients.
              </p>
              <div className="cta-row">
                <button className="btn primary" onClick={() => scrollToId("access")}>
                  Unlock Admin Access
                </button>
                <button className="btn ghost" onClick={() => scrollToId("features")}>
                  View Console Features
                </button>
              </div>
              <div className="trust-row">
                <span>Single admin control lane</span>
                <span>Audit-ready change tracking</span>
              </div>
            </div>

            <div className="hero-card admin-hero-card">
              <div className="card-grid">
                <div className="metric-card">
                  <p className="metric-label">Console Status</p>
                  <p className="metric-value">Live</p>
                  <p className="metric-trend positive">All systems nominal</p>
                </div>
                <div className="metric-card">
                  <p className="metric-label">Access Mode</p>
                  <p className="metric-value">Admin</p>
                  <p className="metric-trend neutral">One project operator</p>
                </div>
                <div className="metric-card">
                  <p className="metric-label">Signal Inputs</p>
                  <p className="metric-value">Unified</p>
                  <p className="metric-trend positive">Listings + Broker Deals</p>
                </div>
                <div className="metric-card">
                  <p className="metric-label">Review Cycle</p>
                  <p className="metric-value">Quarterly</p>
                  <p className="metric-trend neutral">With overrides</p>
                </div>
              </div>
              <div className="hero-note">
                Keep signal quality high with structured inputs and locked audit trails.
              </div>
            </div>
          </div>
        </section>

        <section className="section admin-feature-section" id="features">
          <div className="section-header">
            <p className="eyebrow">Console Features</p>
            <h2>Run the signal desk with clarity and control.</h2>
            <p>
              The admin workspace is organized like a control room: context on the
              left, critical workflows on the right.
            </p>
          </div>

          <div className="admin-feature-grid">
            <div className="card admin-feature-rail">
              <h3>Workspace Modules</h3>
              <p>
                Move from geography selection to live intelligence in a single flow.
                Each module is anchored to a market scope.
              </p>
              <ul className="admin-feature-list">
                <li>Single Admin unlock flow</li>
                <li>Structured listing intake</li>
                <li>Broker deal reconciliation</li>
                <li>Validation notes with audit cues</li>
              </ul>
            </div>

            <div className="admin-feature-stack">
              <div className="card">
                <h3>Signal Input Layer</h3>
                <p>
                  Capture deal flow and developer updates with consistent formatting
                  before they feed scoring pipelines.
                </p>
              </div>
              <div className="card">
                <h3>Admin Review Layer</h3>
                <p>
                  Validate and clean inputs with one Admin-controlled workflow and
                  structured updates for each corridor.
                </p>
              </div>
              <div className="card">
                <h3>Executive Visibility</h3>
                <p>
                  Keep strategic overrides centralized, with quick reads on what
                  changed and why.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section signal-section" id="access">
          <div className="section-header">
            <p className="eyebrow">Admin Access</p>
            <h2>Unlock the admin console.</h2>
            <p>Use the project admin portal to manage signals, live data keys, and dashboards.</p>
          </div>

          {!isAuthenticated ? (
            <div className="signal-grid admin-access-grid">
              <div className="card admin-access-card">
                <h3>Admin Portal</h3>
                <p>No password is required for the project demo console.</p>
                <form onSubmit={handleLoginSubmit} className="admin-form">
                  {loginForm.error && (
                    <span className="admin-error">{loginForm.error}</span>
                  )}
                  <button className="btn primary" type="submit" disabled={loginForm.loading}>
                    {loginForm.loading ? "Unlocking..." : "Unlock Admin Console"}
                  </button>
                </form>
              </div>

              <div className="card contact-card">
                <h3>Need Access?</h3>
                <p>Request an internal access brief from the investment desk.</p>
                <div className="contact-list">
                  <div>
                    <span className="contact-label">Support</span>
                    <span>niharlakhani2@gmail.com</span>
                  </div>
                  <div>
                    <span className="contact-label">Office</span>
                    <span>Pune, India (Temporary)</span>
                  </div>
                </div>
                <button className="btn primary full" type="button">
                  Email Admin Access
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-status-banner">
              <p>
                Portal: <strong>{ROLE_LABELS[role] || "Admin"}</strong>
              </p>
              <div className="admin-status-actions">
                <p>Access unlocked. Proceed to the workflow tools below.</p>
                <div className="admin-status-buttons">
                  <button
                    className="btn primary"
                    onClick={() => navigate("/investor-dashboard")}
                    type="button"
                  >
                    Open Investor Dashboard
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => navigate("/enterprise-workbench")}
                    type="button"
                  >
                    Open Enterprise Workbench
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => navigate("/data-sheet")}
                    type="button"
                  >
                    Open Master Data Sheet
                  </button>
                  <button className="btn ghost" onClick={logout} type="button">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {isAuthenticated && (
          <section className="section" id="tools">
            <div className="section-header">
              <p className="eyebrow">Workflow Tools</p>
              <h2>Maintain signal quality by geography.</h2>
              <p>Scope the market and submit verified inputs.</p>
            </div>

            <div className="admin-tools">
              <div className="card admin-scope-card">
                <h3>Market Scope</h3>
                <GeoSelector selection={selection} onChange={setSelection} />
              </div>

              {(canManageData || canManageAll) && (
                <form className="card admin-form" onSubmit={handleLiveApiSubmit}>
                  <h3>Live Data API Key</h3>
                  <p>
                    Recommended provider: Google Maps Platform with Places API and Routes API
                    enabled. The key is used only while live charts or heatmaps are open.
                  </p>
                  <label className="admin-field">
                    <span className="admin-field-label">Provider</span>
                    <select
                      value={liveApiForm.provider}
                      onChange={(e) =>
                        setLiveApiForm({ ...liveApiForm, provider: e.target.value })
                      }
                    >
                      <option value="google_maps">Google Maps Platform</option>
                      <option value="custom_market_data">Custom Market Data API</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">API Key</span>
                    <input
                      type="password"
                      placeholder="Paste API key"
                      value={liveApiForm.apiKey}
                      onChange={(e) =>
                        setLiveApiForm({ ...liveApiForm, apiKey: e.target.value })
                      }
                    />
                    <span className="admin-field-help">
                      Keep the key restricted in the provider dashboard. For Google web-service
                      calls, prefer server/IP restrictions where possible.
                    </span>
                  </label>
                  <label className="admin-role-option">
                    <input
                      type="checkbox"
                      checked={liveApiForm.enabled}
                      onChange={(e) =>
                        setLiveApiForm({ ...liveApiForm, enabled: e.target.checked })
                      }
                    />
                    Enable live API mode for graph refresh
                  </label>
                  <div className="admin-status-buttons">
                    <button className="btn primary" type="submit">
                      Save API Key
                    </button>
                    <button className="btn ghost" type="button" onClick={handleClearLiveApi}>
                      Clear Key
                    </button>
                  </div>
                  {liveApiMessage && <span className="admin-field-help">{liveApiMessage}</span>}
                </form>
              )}

              {(canManageData || canManageAll) && (
                <form className="card admin-form" onSubmit={handleGoogleDataSubmit}>
                  <h3>Google Data Connections</h3>
                  <p>
                    One Google Maps key covers Maps JavaScript, Places, and Routes. Programmable
                    Search also needs its own API key and Search Engine ID.
                  </p>
                  <label className="admin-field">
                    <span className="admin-field-label">Maps, Places, and Routes API Key</span>
                    <input
                      type="password"
                      placeholder="AIza..."
                      value={googleDataForm.mapsApiKey}
                      onChange={(e) => setGoogleDataForm({ ...googleDataForm, mapsApiKey: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Programmable Search API Key</span>
                    <input
                      type="password"
                      placeholder="AIza..."
                      value={googleDataForm.searchApiKey}
                      onChange={(e) => setGoogleDataForm({ ...googleDataForm, searchApiKey: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Programmable Search Engine ID</span>
                    <input
                      placeholder="cx value"
                      value={googleDataForm.searchEngineId}
                      onChange={(e) => setGoogleDataForm({ ...googleDataForm, searchEngineId: e.target.value })}
                    />
                  </label>
                  <label className="admin-role-option">
                    <input
                      type="checkbox"
                      checked={googleDataForm.enabled}
                      onChange={(e) => setGoogleDataForm({ ...googleDataForm, enabled: e.target.checked })}
                    />
                    Enable Google location and search enrichment
                  </label>
                  <div className="admin-status-buttons">
                    <button className="btn primary" type="submit">Save and Verify</button>
                    <button className="btn ghost" type="button" onClick={handleGoogleDataVerify}>Verify Connections</button>
                    <button className="btn ghost" type="button" onClick={handleClearGoogleData}>Clear Google Keys</button>
                  </div>
                  {googleDataMessage && <span className="admin-field-help">{googleDataMessage}</span>}
                </form>
              )}

              {(canManageData || canManageAll) && googleDataForm.searchEngineId && (
                <section className="card admin-form google-search-card">
                  <h3>Google Source Search</h3>
                  <GoogleProgrammableSearch searchEngineId={googleDataForm.searchEngineId} />
                </section>
              )}

              {(canManageData || canManageAll) && (
                <form className="card admin-form" onSubmit={handleOpenRouterSubmit}>
                  <h3>OpenRouter AI Key</h3>
                  <p>
                    Verify this key with a small AI request before using it for AI-assisted analysis. Create the API key in OpenRouter and
                    set the official key limit to 0.008 USD. This project also enforces a local
                    $0.008 cap before making OpenRouter calls.
                  </p>
                  <label className="admin-field">
                    <span className="admin-field-label">API Key</span>
                    <input
                      type="password"
                      placeholder="sk-or-v1-..."
                      value={openRouterForm.apiKey}
                      onChange={(e) =>
                        setOpenRouterForm({ ...openRouterForm, apiKey: e.target.value })
                      }
                    />
                    <span className="admin-field-help">
                      For the official cap, create or edit the key in OpenRouter and set limit =
                      0.008. OpenRouter returns the plain key only once.
                    </span>
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Model</span>
                    <select
                      value={openRouterForm.model}
                      onChange={(e) =>
                        setOpenRouterForm({ ...openRouterForm, model: e.target.value })
                      }
                    >
                      <option value="openrouter/auto">OpenRouter Auto</option>
                      <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                      <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Local Usage Cap</span>
                    <input type="number" value="0.008" readOnly />
                    <span className="admin-field-help">
                      Hard-coded project cap requested: $0.008.
                    </span>
                  </label>
                  <label className="admin-role-option">
                    <input
                      type="checkbox"
                      checked={openRouterForm.enabled}
                      onChange={(e) =>
                        setOpenRouterForm({
                          ...openRouterForm,
                          enabled: e.target.checked,
                        })
                      }
                    />
                    Enable OpenRouter for this browser
                  </label>
                  <div className="admin-status-buttons">
                    <button className="btn primary" type="submit">
                      Save OpenRouter Key
                    </button>
                    <button className="btn ghost" type="button" onClick={handleOpenRouterStatus}>
                      Check Key
                    </button>
                    <button className="btn ghost" type="button" onClick={handleOpenRouterTest}>
                      Test AI Response
                    </button>
                    <button className="btn ghost" type="button" onClick={handleClearOpenRouter}>
                      Clear Key
                    </button>
                  </div>
                  {openRouterMessage && (
                    <span className="admin-field-help">{openRouterMessage}</span>
                  )}
                </form>
              )}

              {(canManageData || canManageAll) && (
                <div className="card admin-form">
                  <div>
                    <h3>ML Model Evidence</h3>
                    <p>
                      The scoring model is loaded from the paper-ready JSON config and exposed
                      through live API endpoints for evaluation.
                    </p>
                  </div>
                  <div className="trust-row">
                    <span>Audit: {modelAudit?.status || "loading"}</span>
                    <span>Rows: {modelAudit?.rows_checked ?? "-"}</span>
                    <span>
                      Source:{" "}
                      {modelAudit?.source_status ||
                        modelMethodology?.modules?.[0]?.formula?.source_status ||
                        "loading"}
                    </span>
                  </div>
                  <div>
                    <div className="admin-read-row">
                      <span>Config</span>
                      <span>
                        {modelAudit?.config_path ||
                          modelMethodology?.modules?.[0]?.formula?.config_path ||
                          "backend/config/model_config.json"}
                      </span>
                    </div>
                    <div className="admin-read-row">
                      <span>Score Range</span>
                      <span>
                        {modelAudit?.score_range
                          ? `${modelAudit.score_range.min} - ${modelAudit.score_range.max}`
                          : "-"}
                      </span>
                    </div>
                    <div className="admin-read-row">
                      <span>Risk Range</span>
                      <span>
                        {modelAudit?.risk_probability_range_pct
                          ? `${modelAudit.risk_probability_range_pct.min}% - ${modelAudit.risk_probability_range_pct.max}%`
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4>Feature Weights</h4>
                    {Object.entries(
                      modelMethodology?.modules?.[0]?.formula?.feature_weights || {}
                    ).map(([key, value]) => (
                      <div key={key} className="admin-read-row">
                        <span>{key.replaceAll("_", " ")}</span>
                        <span>{Number(value).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4>Synopsis Traceability</h4>
                    {(modelTraceability?.items || []).slice(0, 4).map((item) => (
                      <div key={item.synopsis_requirement} className="admin-read-row">
                        <span>{item.synopsis_requirement}</span>
                        <span>{item.status.replaceAll("_", " ")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="admin-status-buttons">
                    <button className="btn ghost" type="button" onClick={refreshModelEvidence}>
                      Refresh Model Evidence
                    </button>
                  </div>
                  {modelError && <span className="admin-error">{modelError}</span>}
                </div>
              )}

              {canManageGeneral && (
                <div className="admin-form-grid">
                  <form onSubmit={handleSubmitListing} className="card admin-form">
                    <h3>Admin Inputs - Developer Listings</h3>
                    <input
                      name="company"
                      placeholder="Company (e.g., Lodha)"
                      value={listingForm.company}
                      onChange={handleListingChange}
                      required
                    />
                    <input
                      name="project"
                      placeholder="Project Name"
                      value={listingForm.project}
                      onChange={handleListingChange}
                      required
                    />
                    <input
                      name="stage"
                      placeholder="Stage (e.g., Launch / Under Construction)"
                      value={listingForm.stage}
                      onChange={handleListingChange}
                    />
                    <input
                      name="priceRange"
                      placeholder="Price Range"
                      value={listingForm.priceRange}
                      onChange={handleListingChange}
                    />
                    <button className="btn primary" type="submit" disabled={!selection.area}>
                      Add Listing
                    </button>
                  </form>

                  <form onSubmit={handleSubmitDeal} className="card admin-form">
                    <h3>Admin Inputs - Broker Submitted Deals</h3>
                    <input
                      name="broker"
                      placeholder="Broker Name"
                      value={dealForm.broker}
                      onChange={handleDealChange}
                    />
                    <input
                      name="asset"
                      placeholder="Asset / Property"
                      value={dealForm.asset}
                      onChange={handleDealChange}
                      required
                    />
                    <input
                      name="status"
                      placeholder="Status (e.g., Pending / Closed)"
                      value={dealForm.status}
                      onChange={handleDealChange}
                    />
                    <input
                      name="price"
                      placeholder="Price"
                      value={dealForm.price}
                      onChange={handleDealChange}
                    />
                    <input
                      name="notes"
                      placeholder="Notes"
                      value={dealForm.notes}
                      onChange={handleDealChange}
                    />
                    <button className="btn primary" type="submit" disabled={!selection.area}>
                      Add Broker Deal
                    </button>
                  </form>

                  <form onSubmit={handleSubmitValidation} className="card admin-form">
                    <h3>Admin Inputs - On-Demand Validations</h3>
                    <input
                      name="summary"
                      placeholder="Validation Summary"
                      value={validationForm.summary}
                      onChange={handleValidationChange}
                      required
                    />
                    <input
                      name="trend"
                      placeholder="Trend (Up / Down / Stable)"
                      value={validationForm.trend}
                      onChange={handleValidationChange}
                    />
                    <input
                      name="confidence"
                      placeholder="Confidence (0-100)"
                      value={validationForm.confidence}
                      onChange={handleValidationChange}
                    />
                    <input
                      name="source"
                      placeholder="Source / Evidence"
                      value={validationForm.source}
                      onChange={handleValidationChange}
                    />
                    <button className="btn primary" type="submit" disabled={!selection.area}>
                      Add Validation
                    </button>
                  </form>
                </div>
              )}

              {canManageData && (
                <div className="card admin-review">
                  <h3>City Intelligence Layer (Tier 1 & Tier 2)</h3>
                  <p>
                    Manual input for Mumbai, Pune, Bengaluru, Hyderabad, NCR, and Chennai.
                    This drives City Attractiveness, Capital Rotation Ranking, and Supply Risk Band.
                  </p>
                  <form onSubmit={handleCityIntelligenceSubmit} className="admin-form">
                    <label className="admin-field">
                      <span className="admin-field-label">City</span>
                      <select
                        value={cityForm.city}
                        onChange={(e) => handleCitySelection(e.target.value)}
                      >
                        {CITY_INTELLIGENCE_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>
                    {CITY_INTELLIGENCE_FIELDS.map((field) => (
                      <label key={field.key} className="admin-field">
                        <span className="admin-field-label">{field.label}</span>
                        <input
                          type="number"
                          step={field.step}
                          value={cityForm[field.key]}
                          onChange={(e) =>
                            setCityForm({
                              ...cityForm,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                        <span className="admin-field-help">{field.hint}</span>
                      </label>
                    ))}
                    <button className="btn primary" type="submit">
                      Save City Intelligence
                    </button>
                    {cityIntelError && <span className="admin-error">{cityIntelError}</span>}
                  </form>

                  <div className="admin-review-grid">
                    <div>
                      <h4>City Ranking Output</h4>
                      {cityIntelRows.length === 0 ? (
                        <p>No city intelligence rows available.</p>
                      ) : (
                        cityIntelRows.map((row) => (
                          <div key={row.city} className="admin-read-row">
                            <span>{row.city}</span>
                            <span>Attractiveness: {row.city_attractiveness_score}</span>
                            <span>Rotation Rank: #{row.capital_rotation_ranking}</span>
                            <span>Supply Risk: {row.supply_risk_band}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!canManageData && canViewData && (
                <div className="card admin-review">
                  <h3>City Intelligence Ranking (Read Only)</h3>
                  {cityIntelRows.length === 0 ? (
                    <p>No city intelligence rows available.</p>
                  ) : (
                    cityIntelRows.map((row) => (
                      <div key={row.city} className="admin-read-row">
                        <span>{row.city}</span>
                        <span>Attractiveness: {row.city_attractiveness_score}</span>
                        <span>Rotation Rank: #{row.capital_rotation_ranking}</span>
                        <span>Supply Risk: {row.supply_risk_band}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {canManageData && (
                <div className="card admin-review">
                  <h3>Micro-Market Engine (Alpha Zone)</h3>
                  <p>
                    Manual input for micro-markets until API feeds are wired.
                    Outputs: Mispricing Index, Demand Momentum Score, Oversupply Risk, Liquidity Depth.
                  </p>
                  <form onSubmit={handleMicroSubmit} className="admin-form">
                    <label className="admin-field">
                      <span className="admin-field-label">City</span>
                      <select
                        value={microForm.city}
                        onChange={(e) => handleMicroCityChange(e.target.value)}
                      >
                        {CITY_INTELLIGENCE_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-field">
                      <span className="admin-field-label">Micro-market</span>
                      <select
                        value={microForm.micro_market}
                        onChange={(e) => handleMicroMarketChange(e.target.value)}
                      >
                        {(MICRO_MARKET_OPTIONS[microForm.city] || []).map((market) => (
                          <option key={market} value={market}>
                            {market}
                          </option>
                        ))}
                      </select>
                    </label>
                    {MICRO_MARKET_MANUAL_FIELDS.map((field) => (
                      <label key={field.key} className="admin-field">
                        <span className="admin-field-label">{field.label}</span>
                        <input
                          type="number"
                          step={field.step}
                          value={microForm[field.key]}
                          onChange={(e) =>
                            setMicroForm({
                              ...microForm,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                        <span className="admin-field-help">{field.hint}</span>
                      </label>
                    ))}
                    <button className="btn primary" type="submit">
                      Save Micro-Market Input
                    </button>
                    {microError && <span className="admin-error">{microError}</span>}
                  </form>

                  <div className="admin-review-grid">
                    <div>
                      <h4>Micro-Market Scores</h4>
                      {microRows.length === 0 ? (
                        <p>No micro-market rows available.</p>
                      ) : (
                        microRows.map((row) => (
                          <div key={`${row.city}-${row.micro_market}`} className="admin-read-row">
                            <span>{row.city} - {row.micro_market}</span>
                            <span>Mispricing: {row.mispricing_index}</span>
                            <span>Demand: {row.demand_momentum_score}</span>
                            <span>Oversupply: {row.oversupply_risk}</span>
                            <span>Liquidity: {row.liquidity_depth_score}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!canManageData && canViewData && (
                <div className="card admin-review">
                  <h3>Micro-Market Engine (Read Only)</h3>
                  {microRows.length === 0 ? (
                    <p>No micro-market rows available.</p>
                  ) : (
                    microRows.map((row) => (
                      <div key={`${row.city}-${row.micro_market}`} className="admin-read-row">
                        <span>{row.city} - {row.micro_market}</span>
                        <span>Mispricing: {row.mispricing_index}</span>
                        <span>Demand: {row.demand_momentum_score}</span>
                        <span>Oversupply: {row.oversupply_risk}</span>
                        <span>Liquidity: {row.liquidity_depth_score}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {canManageGeneral && (
                <div className="card admin-review">
                  <h3>Developer Intelligence (API + Manual Split)</h3>
                  <p>
                    API-sourced fields are read-only. Enter manual fields where APIs are not available:
                    balance sheet leverage and past investor outcomes.
                  </p>
                  <form onSubmit={handleDeveloperManualSubmit} className="admin-form">
                    <label className="admin-field">
                      <span className="admin-field-label">Developer</span>
                      <select
                        value={developerForm.developer_name}
                        onChange={(e) => handleDeveloperSelection(e.target.value)}
                      >
                        {DEVELOPER_OPTIONS.map((dev) => (
                          <option key={dev} value={dev}>
                            {dev}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(() => {
                      const selected = developerRows.find(
                        (row) => row.developer_name === developerForm.developer_name
                      );
                      return (
                        <div className="admin-read-row">
                          <span>API Delivery Delays %: {selected?.api_delivery_delay_pct ?? "-"}</span>
                          <span>API Litigation Cases: {selected?.api_past_litigation_cases ?? "-"}</span>
                          <span>API RERA Compliance: {selected?.api_rera_compliance_score ?? "-"}</span>
                          <span>API Completion Ratio %: {selected?.api_project_completion_ratio_pct ?? "-"}</span>
                        </div>
                      );
                    })()}
                    {DEVELOPER_MANUAL_FIELDS.map((field) => (
                      <label key={field.key} className="admin-field">
                        <span className="admin-field-label">{field.label}</span>
                        <input
                          type="number"
                          step={field.step}
                          value={developerForm[field.key]}
                          onChange={(e) =>
                            setDeveloperForm({
                              ...developerForm,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                        <span className="admin-field-help">{field.hint}</span>
                      </label>
                    ))}
                    <button className="btn primary" type="submit">
                      Save Manual Developer Inputs
                    </button>
                    {developerError && <span className="admin-error">{developerError}</span>}
                  </form>

                  <div className="admin-review-grid">
                    <div>
                      <h4>Developer Reliability Outputs</h4>
                      {developerRows.length === 0 ? (
                        <p>No developer rows available.</p>
                      ) : (
                        developerRows.map((row) => (
                          <div key={row.developer_name} className="admin-read-row">
                            <span>{row.developer_name}</span>
                            <span>Reliability: {row.developer_reliability_score}</span>
                            <span>Risk Band: {row.execution_risk_band}</span>
                            <span>Execution Risk Score: {row.execution_risk_score}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {canManageGeneral && (
                <div className="card admin-review">
                  <h3>Layer 5: Deal-Level Survival Engine (API + Manual Split)</h3>
                  <p>
                    API-sourced fields are read-only. Enter manual fields for deals where APIs are not
                    available: purchase price, replacement cost, LTV, DSCR, break-even occupancy, stress
                    vectors, and exit cap stress.
                  </p>
                  <form onSubmit={handleDealSurvivalSubmit} className="admin-form">
                    <label className="admin-field">
                      <span className="admin-field-label">Deal</span>
                      <select
                        value={dealSurvivalForm.deal_name}
                        onChange={(e) => handleDealSurvivalSelection(e.target.value)}
                      >
                        {DEAL_OPTIONS.map((deal) => (
                          <option key={deal} value={deal}>
                            {deal}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(() => {
                      const selected = dealSurvivalRows.find(
                        (row) => row.deal_name === dealSurvivalForm.deal_name
                      );
                      return (
                        <div className="admin-read-row">
                          <span>API Purchase Price (Cr): {selected?.api_purchase_price_cr ?? "-"}</span>
                          <span>API Replacement Cost (Cr): {selected?.api_replacement_cost_cr ?? "-"}</span>
                          <span>API LTV %: {selected?.api_ltv_pct ?? "-"}</span>
                          <span>API DSCR: {selected?.api_dscr ?? "-"}</span>
                          <span>API Break-even Occupancy %: {selected?.api_break_even_occupancy_pct ?? "-"}</span>
                          <span>API Revenue Stress -10%: {selected?.api_revenue_stress_10_pct ?? "-"}</span>
                          <span>API Revenue Stress -15%: {selected?.api_revenue_stress_15_pct ?? "-"}</span>
                          <span>API Exit Cap Stress (bps): {selected?.api_exit_cap_stress_bps ?? "-"}</span>
                        </div>
                      );
                    })()}
                    {DEAL_SURVIVAL_MANUAL_FIELDS.map((field) => (
                      <label key={field.key} className="admin-field">
                        <span className="admin-field-label">{field.label}</span>
                        <input
                          type="number"
                          step={field.step}
                          value={dealSurvivalForm[field.key]}
                          onChange={(e) =>
                            setDealSurvivalForm({
                              ...dealSurvivalForm,
                              [field.key]: e.target.value,
                            })
                          }
                        />
                        <span className="admin-field-help">{field.hint}</span>
                      </label>
                    ))}
                    <button className="btn primary" type="submit">
                      Save Manual Deal Survival Inputs
                    </button>
                    {dealSurvivalError && <span className="admin-error">{dealSurvivalError}</span>}
                  </form>

                  <div className="admin-review-grid">
                    <div>
                      <h4>Deal Survival Outputs</h4>
                      {dealSurvivalRows.length === 0 ? (
                        <p>No deal rows available.</p>
                      ) : (
                        dealSurvivalRows.map((row) => (
                          <div key={row.deal_name} className="admin-read-row">
                            <span>{row.deal_name}</span>
                            <span>Survival Probability: {row.survival_probability}%</span>
                            <span>Downside IRR: {row.downside_irr}%</span>
                            <span>Capital Impairment: {row.capital_impairment_band}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {canManageData && areaIntel && (
                <div className="card admin-review">
                  <h3>Admin - Manage Signal Inputs</h3>
                  <p>Editable grid for the selected area.</p>

                  <div className="admin-review-grid">
                    <div>
                      <h4>Listings</h4>
                      {areaIntel.listings.length === 0 ? (
                        <p>No listings yet.</p>
                      ) : (
                        areaIntel.listings.map((item, index) => (
                          <div key={`${item.project}-${index}`} className="admin-edit-row">
                            <input
                              value={item.company}
                              onChange={(e) =>
                                handleListingUpdate(index, "company", e.target.value)
                              }
                            />
                            <input
                              value={item.project}
                              onChange={(e) =>
                                handleListingUpdate(index, "project", e.target.value)
                              }
                            />
                            <input
                              value={item.stage}
                              onChange={(e) =>
                                handleListingUpdate(index, "stage", e.target.value)
                              }
                            />
                            <input
                              value={item.priceRange}
                              onChange={(e) =>
                                handleListingUpdate(index, "priceRange", e.target.value)
                              }
                            />
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={async () => {
                                removeListing(selection.area, index);
                                await persistIntel(selection.area);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      <h4>Broker Deals</h4>
                      {areaIntel.brokerDeals.length === 0 ? (
                        <p>No broker deals yet.</p>
                      ) : (
                        areaIntel.brokerDeals.map((item, index) => (
                          <div key={`${item.asset}-${index}`} className="admin-edit-row">
                            <input
                              value={item.broker}
                              onChange={(e) =>
                                handleDealUpdate(index, "broker", e.target.value)
                              }
                            />
                            <input
                              value={item.asset}
                              onChange={(e) =>
                                handleDealUpdate(index, "asset", e.target.value)
                              }
                            />
                            <input
                              value={item.status}
                              onChange={(e) =>
                                handleDealUpdate(index, "status", e.target.value)
                              }
                            />
                            <input
                              value={item.price}
                              onChange={(e) =>
                                handleDealUpdate(index, "price", e.target.value)
                              }
                            />
                            <input
                              value={item.notes}
                              onChange={(e) =>
                                handleDealUpdate(index, "notes", e.target.value)
                              }
                            />
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={async () => {
                                removeBrokerDeal(selection.area, index);
                                await persistIntel(selection.area);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      <h4>Validations</h4>
                      {areaIntel.validations.length === 0 ? (
                        <p>No validations yet.</p>
                      ) : (
                        areaIntel.validations.map((item, index) => (
                          <div key={`${item.summary}-${index}`} className="admin-edit-row">
                            <input
                              value={item.summary}
                              onChange={(e) =>
                                handleValidationUpdate(index, "summary", e.target.value)
                              }
                            />
                            <input
                              value={item.trend}
                              onChange={(e) =>
                                handleValidationUpdate(index, "trend", e.target.value)
                              }
                            />
                            <input
                              value={item.confidence}
                              onChange={(e) =>
                                handleValidationUpdate(index, "confidence", e.target.value)
                              }
                            />
                            <input
                              value={item.source}
                              onChange={(e) =>
                                handleValidationUpdate(index, "source", e.target.value)
                              }
                            />
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={async () => {
                                removeValidation(selection.area, index);
                                await persistIntel(selection.area);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!canManageData && canViewData && areaIntel && (
                <div className="card admin-review">
                  <h3>Read Only Signal View</h3>
                  <p>View submitted inputs for the selected area.</p>
                  <div className="admin-review-grid">
                    <div>
                      <h4>Listings</h4>
                      {areaIntel.listings.length === 0 ? (
                        <p>No listings yet.</p>
                      ) : (
                        areaIntel.listings.map((item, index) => (
                          <div key={`${item.project}-${index}`} className="admin-read-row">
                            <span>{item.company}</span>
                            <span>{item.project}</span>
                            <span>{item.stage || "Stage N/A"}</span>
                            <span>{item.priceRange || "Price N/A"}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div>
                      <h4>Broker Deals</h4>
                      {areaIntel.brokerDeals.length === 0 ? (
                        <p>No broker deals yet.</p>
                      ) : (
                        areaIntel.brokerDeals.map((item, index) => (
                          <div key={`${item.asset}-${index}`} className="admin-read-row">
                            <span>{item.broker || "Broker N/A"}</span>
                            <span>{item.asset}</span>
                            <span>{item.status || "Status N/A"}</span>
                            <span>{item.price || "Price N/A"}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div>
                      <h4>Validations</h4>
                      {areaIntel.validations.length === 0 ? (
                        <p>No validations yet.</p>
                      ) : (
                        areaIntel.validations.map((item, index) => (
                          <div key={`${item.summary}-${index}`} className="admin-read-row">
                            <span>{item.summary}</span>
                            <span>{item.trend || "Trend N/A"}</span>
                            <span>{item.confidence || "Confidence N/A"}</span>
                            <span>{item.source || "Source N/A"}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}
      </main>
    </div>
  );
}
