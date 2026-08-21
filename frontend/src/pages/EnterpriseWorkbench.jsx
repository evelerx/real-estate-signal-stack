import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  fetchCityIntelligence,
  fetchDeveloperIntelligence,
  fetchMacroOverview,
  generateIcMemo,
  modelDownside,
  simulateCapitalAllocation,
} from "../services/enterpriseApi";
import {
  fetchCityIntelligenceInputs,
  fetchMicroMarketEngine,
} from "../services/cityIntelApi";
import { fetchDeveloperIntelligenceLayer } from "../services/developerIntelApi";
import { fetchDealSurvivalLayer } from "../services/dealSurvivalApi";
import "./EnterpriseWorkbench.css";

const COMPASS_OUTPUTS = [
  { key: "market_score", label: "Market Score (0-100)", decimals: 2, suffix: "" },
  { key: "supply_pressure_index", label: "Supply Pressure Index", decimals: 2, suffix: "" },
  { key: "liquidity_depth_index", label: "Liquidity Depth Index", decimals: 2, suffix: "" },
  { key: "demand_momentum_score", label: "Demand Momentum Score", decimals: 2, suffix: "" },
];

const COMPASS_INPUTS = [
  { key: "price_cagr_5y_pct", label: "5Y Price CAGR", decimals: 2, suffix: "%" },
  { key: "rental_yield_trend_bps", label: "Rental Yield Trend", decimals: 0, suffix: " bps" },
  { key: "units_under_construction", label: "Units Under Construction", decimals: 0, suffix: "" },
  { key: "absorption_rate_pct", label: "Absorption Rate", decimals: 2, suffix: "%" },
  { key: "months_of_inventory", label: "Months of Inventory", decimals: 1, suffix: " mo" },
  { key: "employment_growth_pct", label: "Employment Growth", decimals: 2, suffix: "%" },
  { key: "net_migration_k", label: "Net Migration", decimals: 1, suffix: "k" },
  { key: "transaction_volume_cr", label: "Transaction Volume", decimals: 0, suffix: " Cr" },
  { key: "cap_rate_trend_bps", label: "Cap Rate Trend", decimals: 0, suffix: " bps" },
];

function formatMetricValue(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function TrendNumber({ metric, decimals = 2, suffix = "" }) {
  const current = Number(metric?.current);
  const previous = Number(metric?.previous);
  if (!Number.isFinite(current)) return <span className="trend-number trend-flat">N/A</span>;

  let arrow = "\u2192";
  let trendClass = "trend-flat";
  if (Number.isFinite(previous)) {
    if (current > previous) {
      arrow = "\u25B2";
      trendClass = "trend-up";
    } else if (current < previous) {
      arrow = "\u25BC";
      trendClass = "trend-down";
    }
  }

  return (
    <span className={`trend-number ${trendClass}`}>
      {arrow} {formatMetricValue(current, decimals)}
      {suffix}
    </span>
  );
}

export default function EnterpriseWorkbench() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cityIntel, setCityIntel] = useState(null);
  const [devIntel, setDevIntel] = useState(null);
  const [allocationResult, setAllocationResult] = useState(null);
  const [downsideResult, setDownsideResult] = useState(null);
  const [memoResult, setMemoResult] = useState(null);
  const [macroOverview, setMacroOverview] = useState(null);
  const [manualCityLayer, setManualCityLayer] = useState([]);
  const [manualMicroLayer, setManualMicroLayer] = useState([]);
  const [developerLayerRows, setDeveloperLayerRows] = useState([]);
  const [dealSurvivalRows, setDealSurvivalRows] = useState([]);

  function showActionError(message) {
    setError(message);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }

  const [allocForm, setAllocForm] = useState({
    target_irr: 16,
    max_ltv: 60,
    risk_tolerance: "medium",
    holding_period_years: 5,
    total_capital_cr: 120,
    residential_pct: 40,
    commercial_pct: 35,
    industrial_pct: 25,
  });

  const [downsideForm, setDownsideForm] = useState({
    revenue_shock_pct: 18,
    rate_shock_bps: 180,
    cap_rate_expansion_bps: 120,
    liquidity_contraction_pct: 22,
    base_default_probability_pct: 6.5,
  });

  const [memoForm, setMemoForm] = useState({
    deal_name: "Growth Corridor Alpha",
    city: "Pune",
    micro_market: "Wakad",
    target_equity_cr: 42,
  });

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      fetchCityIntelligence(accessToken),
      fetchDeveloperIntelligence(accessToken),
      fetchMacroOverview(accessToken),
      fetchCityIntelligenceInputs(accessToken).catch(() => ({ cities: [] })),
      fetchMicroMarketEngine(accessToken).catch(() => ({ micro_markets: [] })),
      fetchDeveloperIntelligenceLayer(accessToken).catch(() => ({ developers: [] })),
      fetchDealSurvivalLayer(accessToken).catch(() => ({ deals: [] })),
    ])
      .then(([c, d, m, cityLayer, microLayer, developerLayer, dealLayer]) => {
        setCityIntel(c);
        setDevIntel(d);
        setMacroOverview(m);
        setManualCityLayer(Array.isArray(cityLayer?.cities) ? cityLayer.cities : []);
        setManualMicroLayer(Array.isArray(microLayer?.micro_markets) ? microLayer.micro_markets : []);
        setDeveloperLayerRows(Array.isArray(developerLayer?.developers) ? developerLayer.developers : []);
        setDealSurvivalRows(Array.isArray(dealLayer?.deals) ? dealLayer.deals : []);
      })
      .catch((err) => setError(err.message || "Failed to load enterprise data"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const sectorTargets = useMemo(
    () => ({
      residential: Number(allocForm.residential_pct),
      commercial: Number(allocForm.commercial_pct),
      industrial: Number(allocForm.industrial_pct),
    }),
    [allocForm]
  );

  const absorptionCapRateSeries = useMemo(() => {
    if (!macroOverview) return [];
    const capByPeriod = Object.fromEntries(
      (macroOverview.cap_rate_trend_pct || []).map((x) => [x.period, x.value])
    );
    return (macroOverview.absorption_rate_pct || []).map((x) => ({
      period: x.period,
      absorption_pct: x.value,
      cap_rate_pct: capByPeriod[x.period],
    }));
  }, [macroOverview]);

  async function runAllocation() {
    setError("");
    try {
      const payload = {
        target_irr: Number(allocForm.target_irr),
        max_ltv: Number(allocForm.max_ltv),
        risk_tolerance: allocForm.risk_tolerance,
        holding_period_years: Number(allocForm.holding_period_years),
        total_capital_cr: Number(allocForm.total_capital_cr),
        sector_targets: sectorTargets,
      };
      const result = await simulateCapitalAllocation(accessToken, payload);
      setAllocationResult(result);
    } catch (err) {
      showActionError(err.message || "Allocation simulation failed");
    }
  }

  async function runDownside() {
    setError("");
    try {
      const payload = {
        revenue_shock_pct: Number(downsideForm.revenue_shock_pct),
        rate_shock_bps: Number(downsideForm.rate_shock_bps),
        cap_rate_expansion_bps: Number(downsideForm.cap_rate_expansion_bps),
        liquidity_contraction_pct: Number(downsideForm.liquidity_contraction_pct),
        base_default_probability_pct: Number(downsideForm.base_default_probability_pct),
      };
      const result = await modelDownside(accessToken, payload);
      setDownsideResult(result);
    } catch (err) {
      showActionError(err.message || "Downside modeling failed");
    }
  }

  async function runMemo() {
    setError("");
    try {
      const payload = {
        deal_name: memoForm.deal_name,
        city: memoForm.city,
        micro_market: memoForm.micro_market,
        target_equity_cr: Number(memoForm.target_equity_cr),
        downside: {
          revenue_shock_pct: Number(downsideForm.revenue_shock_pct),
          rate_shock_bps: Number(downsideForm.rate_shock_bps),
          cap_rate_expansion_bps: Number(downsideForm.cap_rate_expansion_bps),
          liquidity_contraction_pct: Number(downsideForm.liquidity_contraction_pct),
          base_default_probability_pct: Number(downsideForm.base_default_probability_pct),
        },
      };
      const result = await generateIcMemo(accessToken, payload);
      setMemoResult(result);
    } catch (err) {
      showActionError(err.message || "IC memo generation failed");
    }
  }

  if (!accessToken) return <div className="enterprise-shell">Login required.</div>;
  if (loading) return <div className="enterprise-shell">Loading enterprise workbench...</div>;

  return (
    <div className="enterprise-shell">
      <header className="enterprise-header">
        <div>
          <p className="enterprise-kicker">Enterprise Layers</p>
          <h1>Capital Intelligence Workbench</h1>
        </div>
        <div className="enterprise-actions">
          <button className="enterprise-btn" onClick={() => navigate("/data-sheet")}>
            Master Data Sheet
          </button>
          <button className="enterprise-btn" onClick={() => navigate("/investor-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </header>

      {error && <div className="enterprise-error">{error}</div>}

      <section className="enterprise-card">
        <h2>1) Expansion Compass: Where Should Capital Go?</h2>
        <p className="enterprise-muted">
          Micro-market scoring from fundamentals only. Green is improving, red is deteriorating.
        </p>
        <div className="enterprise-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Market</th>
                {COMPASS_OUTPUTS.map((item) => (
                  <th key={item.key}>{item.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cityIntel?.micro_markets || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.city} - {row.micro_market}</td>
                  {COMPASS_OUTPUTS.map((item) => (
                    <td key={`${row.id}-${item.key}`}>
                      <TrendNumber
                        metric={row.expansion_compass_outputs?.[item.key]}
                        decimals={item.decimals}
                        suffix={item.suffix}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Input Diagnostics (Micro-market)</h3>
        <div className="enterprise-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Market</th>
                {COMPASS_INPUTS.map((item) => (
                  <th key={item.key}>{item.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cityIntel?.micro_markets || []).map((row) => (
                <tr key={`${row.id}-inputs`}>
                  <td>{row.city} - {row.micro_market}</td>
                  {COMPASS_INPUTS.map((item) => (
                    <td key={`${row.id}-input-${item.key}`}>
                      <TrendNumber
                        metric={row.expansion_compass_inputs?.[item.key]}
                        decimals={item.decimals}
                        suffix={item.suffix}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>2) Capital Allocation Simulation Engine</h2>
        <div className="enterprise-grid">
          <label>Target IRR %<input type="number" value={allocForm.target_irr} onChange={(e) => setAllocForm({ ...allocForm, target_irr: e.target.value })} /></label>
          <label>Max LTV %<input type="number" value={allocForm.max_ltv} onChange={(e) => setAllocForm({ ...allocForm, max_ltv: e.target.value })} /></label>
          <label>Risk Tolerance<select value={allocForm.risk_tolerance} onChange={(e) => setAllocForm({ ...allocForm, risk_tolerance: e.target.value })}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></label>
          <label>Holding Period (years)<input type="number" value={allocForm.holding_period_years} onChange={(e) => setAllocForm({ ...allocForm, holding_period_years: e.target.value })} /></label>
          <label>Total Capital (Cr)<input type="number" value={allocForm.total_capital_cr} onChange={(e) => setAllocForm({ ...allocForm, total_capital_cr: e.target.value })} /></label>
          <label>Residential %<input type="number" value={allocForm.residential_pct} onChange={(e) => setAllocForm({ ...allocForm, residential_pct: e.target.value })} /></label>
          <label>Commercial %<input type="number" value={allocForm.commercial_pct} onChange={(e) => setAllocForm({ ...allocForm, commercial_pct: e.target.value })} /></label>
          <label>Industrial %<input type="number" value={allocForm.industrial_pct} onChange={(e) => setAllocForm({ ...allocForm, industrial_pct: e.target.value })} /></label>
        </div>
        <button className="enterprise-btn" onClick={runAllocation}>Run Allocation Simulation</button>
        {allocationResult && (
          <pre className="enterprise-json">{JSON.stringify(allocationResult, null, 2)}</pre>
        )}
      </section>

      <section className="enterprise-card">
        <h2>Manual Layer: Tier 1/2 City Ranking Clarity</h2>
        <div className="enterprise-table-wrap">
          <table>
            <thead>
              <tr>
                <th>City</th>
                <th>Attractiveness</th>
                <th>Rotation Rank</th>
                <th>Supply Risk Band</th>
              </tr>
            </thead>
            <tbody>
              {manualCityLayer.map((row) => (
                <tr key={row.city}>
                  <td>{row.city}</td>
                  <td>{row.city_attractiveness_score}</td>
                  <td>{row.capital_rotation_ranking}</td>
                  <td>{row.supply_risk_band}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>Manual Layer: Micro-Market Engine (Alpha Zone)</h2>
        <div className="enterprise-chart-grid">
          <div>
            <h3>Micro-Market Scores</h3>
            <div className="enterprise-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={manualMicroLayer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="micro_market" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mispricing_index" fill="#b96d2a" />
                  <Bar dataKey="demand_momentum_score" fill="#4b9a7e" />
                  <Bar dataKey="oversupply_risk" fill="#a45353" />
                  <Bar dataKey="liquidity_depth_score" fill="#3a6b9e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3>Micro-Market Detail</h3>
            <div className="enterprise-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Mispricing</th>
                    <th>Demand</th>
                    <th>Oversupply</th>
                    <th>Liquidity</th>
                  </tr>
                </thead>
                <tbody>
                  {manualMicroLayer.map((row) => (
                    <tr key={`${row.city}-${row.micro_market}`}>
                      <td>{row.city} - {row.micro_market}</td>
                      <td>{row.mispricing_index}</td>
                      <td>{row.demand_momentum_score}</td>
                      <td>{row.oversupply_risk}</td>
                      <td>{row.liquidity_depth_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>Manual Layer: Developer Reliability Engine</h2>
        <div className="enterprise-chart-grid">
          <div>
            <h3>Reliability and Execution Risk</h3>
            <div className="enterprise-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={developerLayerRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="developer_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="developer_reliability_score" fill="#5a9f7b" />
                  <Bar dataKey="execution_risk_score" fill="#aa5f5f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3>Developer Intelligence Detail</h3>
            <div className="enterprise-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Reliability</th>
                    <th>Risk Band</th>
                    <th>Delay %</th>
                    <th>RERA Score</th>
                    <th>Leverage</th>
                  </tr>
                </thead>
                <tbody>
                  {developerLayerRows.map((row) => (
                    <tr key={row.developer_name}>
                      <td>{row.developer_name}</td>
                      <td>{row.developer_reliability_score}</td>
                      <td>{row.execution_risk_band}</td>
                      <td>{row.api_delivery_delay_pct}</td>
                      <td>{row.api_rera_compliance_score}</td>
                      <td>{row.manual_balance_sheet_leverage_ratio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>3) Downside Probability Modeling</h2>
        <div className="enterprise-grid">
          <label>Revenue Shock %<input type="number" value={downsideForm.revenue_shock_pct} onChange={(e) => setDownsideForm({ ...downsideForm, revenue_shock_pct: e.target.value })} /></label>
          <label>Rate Shock (bps)<input type="number" value={downsideForm.rate_shock_bps} onChange={(e) => setDownsideForm({ ...downsideForm, rate_shock_bps: e.target.value })} /></label>
          <label>Cap Rate Expansion (bps)<input type="number" value={downsideForm.cap_rate_expansion_bps} onChange={(e) => setDownsideForm({ ...downsideForm, cap_rate_expansion_bps: e.target.value })} /></label>
          <label>Liquidity Contraction %<input type="number" value={downsideForm.liquidity_contraction_pct} onChange={(e) => setDownsideForm({ ...downsideForm, liquidity_contraction_pct: e.target.value })} /></label>
          <label>Base Default Probability %<input type="number" step="0.1" value={downsideForm.base_default_probability_pct} onChange={(e) => setDownsideForm({ ...downsideForm, base_default_probability_pct: e.target.value })} /></label>
        </div>
        <button className="enterprise-btn" onClick={runDownside}>Run Downside Model</button>
        {downsideResult && (
          <pre className="enterprise-json">{JSON.stringify(downsideResult, null, 2)}</pre>
        )}
      </section>

      <section className="enterprise-card">
        <h2>Layer 5: Deal-Level Survival Engine</h2>
        <div className="enterprise-chart-grid">
          <div>
            <h3>Survival Probability / Downside IRR</h3>
            <div className="enterprise-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealSurvivalRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="deal_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="survival_probability" fill="#4f9d77" />
                  <Bar dataKey="downside_irr" fill="#9f7d44" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3>Deal Survival Detail</h3>
            <div className="enterprise-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Survival %</th>
                    <th>Downside IRR %</th>
                    <th>Impairment Band</th>
                    <th>LTV %</th>
                    <th>DSCR</th>
                  </tr>
                </thead>
                <tbody>
                  {dealSurvivalRows.map((row) => (
                    <tr key={row.deal_name}>
                      <td>{row.deal_name}</td>
                      <td>{row.survival_probability}</td>
                      <td>{row.downside_irr}</td>
                      <td>{row.capital_impairment_band}</td>
                      <td>{row.manual_ltv_pct}</td>
                      <td>{row.manual_dscr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>4) Developer & Counterparty Intelligence</h2>
        <div className="enterprise-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Developer</th>
                <th>Risk Index</th>
                <th>Risk Band</th>
                <th>On-time %</th>
                <th>Leverage</th>
                <th>Litigations</th>
              </tr>
            </thead>
            <tbody>
              {(devIntel?.developers || []).map((row) => (
                <tr key={row.developer_id}>
                  <td>{row.developer_name}</td>
                  <td>{row.developer_risk_index}</td>
                  <td>{row.risk_band}</td>
                  <td>{row.delivery_on_time_pct}</td>
                  <td>{row.leverage_ratio}</td>
                  <td>{row.litigation_cases_open}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="enterprise-card">
        <h2>5) IC Automation + Workflow</h2>
        <div className="enterprise-grid">
          <label>Deal Name<input value={memoForm.deal_name} onChange={(e) => setMemoForm({ ...memoForm, deal_name: e.target.value })} /></label>
          <label>City<input value={memoForm.city} onChange={(e) => setMemoForm({ ...memoForm, city: e.target.value })} /></label>
          <label>Micro-market<input value={memoForm.micro_market} onChange={(e) => setMemoForm({ ...memoForm, micro_market: e.target.value })} /></label>
          <label>Target Equity (Cr)<input type="number" value={memoForm.target_equity_cr} onChange={(e) => setMemoForm({ ...memoForm, target_equity_cr: e.target.value })} /></label>
        </div>
        <button className="enterprise-btn" onClick={runMemo}>Generate IC Memo</button>
        {memoResult && (
          <pre className="enterprise-json">{JSON.stringify(memoResult, null, 2)}</pre>
        )}
      </section>

      {macroOverview && (
        <section className="enterprise-card">
          <h2>Macro + Credit Intelligence Panel</h2>
          <p className="enterprise-muted">As of {macroOverview.as_of}</p>

          <div className="enterprise-kpi-grid">
            <div className="enterprise-kpi"><span>Home Loan Rate</span><strong>{macroOverview.interest_rates.home_loan_rate_pct}%</strong></div>
            <div className="enterprise-kpi"><span>Commercial Loan Rate</span><strong>{macroOverview.interest_rates.commercial_loan_rate_pct}%</strong></div>
            <div className="enterprise-kpi"><span>Loan Penetration</span><strong>{macroOverview.loan_penetration_ratio_pct.loan_financed}%</strong></div>
            <div className="enterprise-kpi"><span>One-time Purchase</span><strong>{macroOverview.loan_penetration_ratio_pct.one_time_payment}%</strong></div>
            <div className="enterprise-kpi"><span>Macro Risk Score</span><strong>{macroOverview.derived_signals.macro_risk_score}</strong></div>
            <div className="enterprise-kpi"><span>Rate Sensitivity Index</span><strong>{macroOverview.derived_signals.rate_sensitivity_index}</strong></div>
            <div className="enterprise-kpi"><span>Demand Momentum Score</span><strong>{macroOverview.derived_signals.demand_momentum_score}</strong></div>
            <div className="enterprise-kpi"><span>Liquidity Tightening Signal</span><strong>{macroOverview.derived_signals.liquidity_tightening_signal}</strong></div>
          </div>

          <div className="enterprise-chart-grid">
            <div>
              <h3>Local Project Launch Pipeline</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={macroOverview.local_project_launch_pipeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="launched" fill="#8c6324" />
                    <Bar dataKey="permitted" fill="#d2ab6c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Absorption Rate + Cap Rate Trend</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={absorptionCapRateSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="absorption_pct" stroke="#3a6b9e" strokeWidth={2} name="Absorption %" />
                    <Line type="monotone" dataKey="cap_rate_pct" stroke="#805b20" strokeWidth={2} name="Cap Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Transaction Volume</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={macroOverview.transaction_volume_cr}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7f5e2f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Loan Penetration Mix</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Bought on Loan", value: macroOverview.loan_penetration_ratio_pct.loan_financed },
                        { name: "One-time Payment", value: macroOverview.loan_penetration_ratio_pct.one_time_payment },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      fill="#b3853c"
                      label
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Migration + Employment Growth</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroOverview.migration_employment_growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="net_migration_k" stroke="#b3853c" strokeWidth={2} />
                    <Line type="monotone" dataKey="employment_growth_pct" stroke="#3a6b9e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Home Loan Rates (3Y+)</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroOverview.home_loan_rate_history_pct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#3a6b9e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3>Optional: GDP Trend (Recession Input)</h3>
              <div className="enterprise-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroOverview.gdp_trend_projection_pct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#805b20" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h3>Optional: City-specific FDI Inflow</h3>
          <div className="enterprise-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>FDI Inflow (USD B)</th>
                </tr>
              </thead>
              <tbody>
                {macroOverview.city_fdi_inflow_usd_b.map((row) => (
                  <tr key={row.city}>
                    <td>{row.city}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
