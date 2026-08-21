import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  fetchDashboardTabData,
  fetchDashboardWorkspace,
  fetchRelationships,
} from "../services/investorDashboardApi";
import {
  fetchCityIntelligenceInputs,
  fetchMicroMarketEngine,
} from "../services/cityIntelApi";
import { fetchDeveloperIntelligenceLayer } from "../services/developerIntelApi";
import { fetchDealSurvivalLayer } from "../services/dealSurvivalApi";
import "./InvestorDashboard.css";

const DASHBOARD_TABS = [
  { id: "summary", label: "Summary" },
  { id: "transactions", label: "Transactions" },
  { id: "known_holdings", label: "Known Holdings" },
  { id: "mortgage_debt", label: "Mortgage Debt" },
];

const RELATIONSHIP_TABS = [
  { id: "venture_partners", label: "Venture Partners" },
  { id: "brokers", label: "Brokers" },
  { id: "lenders", label: "Lenders" },
];

const ACTIVITY_COLORS = { acquisition_b: "#5b8dff", disposition_b: "#7be0e7", net_b: "#f4a340" };
const ENTERPRISE_2CR_FEATURES = [
  "City heatmaps",
  "Risk scoring",
  "Stress modeling",
  "Portfolio allocation simulator",
  "Developer risk database",
  "IC memo automation",
  "API access",
  "Custom advisory layer",
];

function formatMoneyMillions(v) {
  return `$${Number(v).toFixed(1)} M`;
}

function formatPercent(v) {
  return `${Number(v).toFixed(1)}%`;
}

function formatSigned(v, decimals = 1) {
  const n = Number(v || 0);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}`;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function scaleTo100(value, lo, hi) {
  if (hi <= lo) return 0;
  return clamp(((value - lo) / (hi - lo)) * 100, 0, 100);
}

function phaseToneClass(phase) {
  if (phase === "expansion") return "is-positive";
  if (phase === "contraction") return "is-negative";
  return "is-neutral";
}

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const { accessToken, role } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");
  const [relationshipType, setRelationshipType] = useState("venture_partners");
  const [workspace, setWorkspace] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [tabRows, setTabRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [cityIntelRows, setCityIntelRows] = useState([]);
  const [microRows, setMicroRows] = useState([]);
  const [developerRows, setDeveloperRows] = useState([]);
  const [dealSurvivalRows, setDealSurvivalRows] = useState([]);

  const filters = useMemo(
    () => ({
      geography: "All Geographies",
      propertyType: "All Property Types",
      period: "last_quarter",
    }),
    []
  );

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    fetchDashboardWorkspace(accessToken, filters)
      .then((data) => setWorkspace(data))
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [accessToken, filters]);

  useEffect(() => {
    if (!accessToken) return;
    fetchRelationships(accessToken, relationshipType)
      .then((data) => setRelationships(data.items || []))
      .catch((err) => setError(err.message || "Failed to load relationships"));
  }, [accessToken, relationshipType]);

  useEffect(() => {
    if (!accessToken || activeTab === "summary") return;
    fetchDashboardTabData(accessToken, activeTab)
      .then((rows) => setTabRows(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(err.message || "Failed to load tab data"));
  }, [accessToken, activeTab]);

  useEffect(() => {
    if (!accessToken) return;
    fetchCityIntelligenceInputs(accessToken)
      .then((payload) => setCityIntelRows(Array.isArray(payload?.cities) ? payload.cities : []))
      .catch(() => setCityIntelRows([]));
    fetchMicroMarketEngine(accessToken)
      .then((payload) => setMicroRows(Array.isArray(payload?.micro_markets) ? payload.micro_markets : []))
      .catch(() => setMicroRows([]));
    fetchDeveloperIntelligenceLayer(accessToken)
      .then((payload) => setDeveloperRows(Array.isArray(payload?.developers) ? payload.developers : []))
      .catch(() => setDeveloperRows([]));
    fetchDealSurvivalLayer(accessToken)
      .then((payload) => setDealSurvivalRows(Array.isArray(payload?.deals) ? payload.deals : []))
      .catch(() => setDealSurvivalRows([]));
  }, [accessToken]);

  useEffect(() => {
    if (!workspace?.firm_allocation_intel?.capital_by_property_type_b?.length) return;
    setSelectedFirm((current) => current || workspace.firm_allocation_intel.capital_by_property_type_b[0].firm);
  }, [workspace]);

  useEffect(() => {
    const points = workspace?.firm_allocation_intel?.area_priority_by_firm?.[selectedFirm] || [];
    setSelectedArea(points[0] || null);
  }, [workspace, selectedFirm]);

  if (!accessToken) {
    return (
      <div className="investor-shell">
        <p className="investor-error">Login required. Open Admin access first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="investor-shell">
        <p className="investor-muted">Loading investor dashboard...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="investor-shell">
        <p className="investor-error">
          {error || "Investor workspace did not load. Check Admin access and subscription unlock."}
        </p>
        <div className="investor-actions">
          <button className="investor-btn" onClick={() => navigate("/pricing")}>
            Open Pricing / Unlock
          </button>
          <button className="investor-btn" onClick={() => navigate("/admin")}>
            Back to Admin Access
          </button>
        </div>
      </div>
    );
  }

  const kpis = workspace.kpis || {};
  const firmHoldingsRows = workspace.firm_allocation_intel?.firm_holdings_summary || [];
  const areaPriorityByFirm = workspace.firm_allocation_intel?.area_priority_by_firm || {};
  const firmAreaRows = selectedFirm ? areaPriorityByFirm[selectedFirm] || [] : [];
  const mapSrc = selectedArea
    ? `https://maps.google.com/maps?q=${selectedArea.lat},${selectedArea.lng}&z=12&output=embed`
    : "https://maps.google.com/maps?q=India&z=4&output=embed";

  const macroLayer = workspace.india_macro_capital_flow || {};
  const macroSeries = macroLayer.timeseries || [];
  const macroSignals = macroLayer.signals || {};
  const macroInstitutions = macroLayer.institutions || [];
  const peerFirmTracking = macroLayer.peer_firm_tracking || [];
  const latestMacro = macroSeries.length ? macroSeries[macroSeries.length - 1] : null;
  const previousMacro = macroSeries.length > 1 ? macroSeries[macroSeries.length - 2] : latestMacro;
  const macroSnapshotCards = latestMacro
    ? [
        {
          label: "Bank Credit Growth",
          value: `${latestMacro.bank_credit_growth_pct.toFixed(1)}%`,
          delta: `${formatSigned(latestMacro.bank_credit_growth_pct - previousMacro.bank_credit_growth_pct)} pp`,
          heat: scaleTo100(latestMacro.bank_credit_growth_pct, 10.0, 18.0),
        },
        {
          label: "NBFC Lending Growth",
          value: `${latestMacro.nbfc_lending_growth_pct.toFixed(1)}%`,
          delta: `${formatSigned(latestMacro.nbfc_lending_growth_pct - previousMacro.nbfc_lending_growth_pct)} pp`,
          heat: scaleTo100(latestMacro.nbfc_lending_growth_pct, 10.0, 20.0),
        },
        {
          label: "Debt-Financed Purchases",
          value: `${latestMacro.debt_financed_purchase_pct.toFixed(1)}%`,
          delta: `${formatSigned(latestMacro.debt_financed_purchase_pct - previousMacro.debt_financed_purchase_pct)} pp`,
          heat: scaleTo100(latestMacro.debt_financed_purchase_pct, 55.0, 75.0),
        },
        {
          label: "Construction Cost Inflation",
          value: `${latestMacro.construction_cost_inflation_pct.toFixed(1)}%`,
          delta: `${formatSigned(latestMacro.construction_cost_inflation_pct - previousMacro.construction_cost_inflation_pct)} pp`,
          heat: scaleTo100(12.0 - latestMacro.construction_cost_inflation_pct, 0.0, 12.0),
        },
        {
          label: "RE FDI Inflow",
          value: `$${latestMacro.real_estate_fdi_usd_b.toFixed(2)} B`,
          delta: `${formatSigned(latestMacro.real_estate_fdi_usd_b - previousMacro.real_estate_fdi_usd_b, 2)} B`,
          heat: scaleTo100(latestMacro.real_estate_fdi_usd_b, 1.0, 3.5),
        },
        {
          label: "CMBS/REIT Yield Spread",
          value: `${latestMacro.cmbs_reit_yield_spread_bps.toFixed(0)} bps`,
          delta: `${formatSigned(latestMacro.cmbs_reit_yield_spread_bps - previousMacro.cmbs_reit_yield_spread_bps, 0)} bps`,
          heat: scaleTo100(320 - latestMacro.cmbs_reit_yield_spread_bps, 0.0, 120.0),
        },
      ]
    : [];
  const topCityRows = cityIntelRows.slice(0, 6);
  const topMicroRows = microRows.slice(0, 6);
  const topDeveloperRows = developerRows.slice(0, 6);
  const topDealRows = dealSurvivalRows.slice(0, 6);

  return (
    <div className="investor-shell">
      <header className="investor-top">
        <div>
          <p className="investor-eyebrow">Investor Profile</p>
          <h1>Real Estate Portfolio Dashboard</h1>
          <p className="investor-muted">
            Portal: <strong>{role}</strong> | As of {workspace.as_of}
          </p>
        </div>
        <div className="investor-actions">
          <button
            className="investor-btn"
            onClick={() => navigate("/enterprise-workbench")}
          >
            Enterprise Workbench
          </button>
          <button className="investor-btn" onClick={() => navigate("/data-sheet")}>
            Master Data Sheet
          </button>
          <button className="investor-btn" onClick={() => navigate("/admin")}>
            Admin Console
          </button>
          <button className="investor-btn investor-btn-primary">Save / Alert</button>
        </div>
      </header>

      {error && <div className="investor-error">{error}</div>}

      <div className="investor-tabs">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? (
        <div className="investor-grid">
          <section className="investor-card kpi">
            <p>Total Portfolio Value</p>
            <h2>{formatMoneyMillions(kpis.total_portfolio_value_m?.value || 0)}</h2>
            <span>{formatPercent(kpis.total_portfolio_value_m?.delta_pct || 0)} versus prior</span>
          </section>
          <section className="investor-card kpi">
            <p>ROI</p>
            <h2>{formatPercent(kpis.roi_pct?.value || 0)}</h2>
            <span>{formatPercent(kpis.roi_pct?.delta_pct || 0)} versus prior</span>
          </section>
          <section className="investor-card kpi">
            <p>Rate Sensitivity Index</p>
            <h2>{Number(macroSignals.rate_sensitivity_index || 0).toFixed(1)}</h2>
            <span>India debt-linked demand pressure</span>
          </section>
          <section className="investor-card kpi">
            <p>Liquidity Tightening Signal</p>
            <h2>{Number(macroSignals.liquidity_tightening_signal || 0).toFixed(1)}</h2>
            <span>Higher score indicates tighter funding conditions</span>
          </section>
          <section className="investor-card kpi">
            <p>Credit Cycle Indicator</p>
            <h2>{Number(macroSignals.credit_expansion_contraction_cycle_indicator || 0).toFixed(1)}</h2>
            <span className={`credit-phase ${phaseToneClass(macroSignals.credit_cycle_phase)}`}>
              {(macroSignals.credit_cycle_phase || "neutral").toUpperCase()}
            </span>
          </section>
          <section className="investor-card kpi">
            <p>Developer Reliability (Top)</p>
            <h2>{Number(topDeveloperRows[0]?.developer_reliability_score || 0).toFixed(1)}</h2>
            <span>{topDeveloperRows[0]?.developer_name || "No developer data"}</span>
          </section>
          <section className="investor-card kpi">
            <p>Deal Survival Probability (Top)</p>
            <h2>{Number(topDealRows[0]?.survival_probability || 0).toFixed(1)}%</h2>
            <span>{topDealRows[0]?.deal_name || "No deal survival data"}</span>
          </section>

          <section className="investor-card wide">
            <h3>2 Cr Plan Feature Deck</h3>
            <p className="investor-muted">
              Feature visibility and quick launch for enterprise subscription access.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Status</th>
                  <th>Launch</th>
                </tr>
              </thead>
              <tbody>
                {ENTERPRISE_2CR_FEATURES.map((feature) => (
                  <tr key={feature}>
                    <td>{feature}</td>
                    <td>Enabled</td>
                    <td>
                      {feature === "City heatmaps" ? (
                        <a href="/heatmap">Open</a>
                      ) : feature === "Stress modeling" ||
                        feature === "Portfolio allocation simulator" ||
                        feature === "IC memo automation" ||
                        feature === "Custom advisory layer" ? (
                        <a href="/enterprise-workbench">Open</a>
                      ) : feature === "API access" ? (
                        <a href="/data-sheet">Open</a>
                      ) : (
                        <a href="/investor-dashboard">Open</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card wide">
            <h3>Return on Investment Over Time</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workspace.roi_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="month" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Line type="monotone" dataKey="roi_pct" stroke="#d580ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>India Macro Rate Stack (RBI, 10Y G-Sec, Home Loan)</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="period" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Line type="monotone" dataKey="rbi_policy_rate_pct" name="RBI Policy Rate %" stroke="#6ec8ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gsec_10y_yield_pct" name="10Y G-Sec Yield %" stroke="#88df91" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="home_loan_rate_pct" name="Home Loan Rate %" stroke="#ffc478" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Credit Expansion/Contraction Drivers</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={macroSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="period" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="bank_credit_growth_pct" name="Bank Credit Growth %" fill="#4f95ff" />
                  <Bar dataKey="nbfc_lending_growth_pct" name="NBFC Lending Growth %" fill="#60d6c6" />
                  <Line type="monotone" dataKey="debt_financed_purchase_pct" name="Property Purchases Via Debt %" stroke="#f2a75a" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Macro Heat Cards</h3>
            <div className="macro-heat-grid">
              {macroSnapshotCards.map((card) => (
                <article key={card.label} className="macro-heat-card" style={{ "--heat": `${card.heat}%` }}>
                  <p>{card.label}</p>
                  <h4>{card.value}</h4>
                  <span>{card.delta} vs previous quarter</span>
                </article>
              ))}
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Tier 1/2 City Attractiveness + Capital Rotation</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCityRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="city" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="city_attractiveness_score" name="City Attractiveness" fill="#67c4ff" />
                  <Bar dataKey="capital_rotation_ranking" name="Rotation Rank (lower is better)" fill="#9ad76a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Micro-Market Engine Outputs</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMicroRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="micro_market" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="mispricing_index" name="Mispricing Index" fill="#f5a45a" />
                  <Bar dataKey="demand_momentum_score" name="Demand Momentum Score" fill="#61d3b0" />
                  <Bar dataKey="oversupply_risk" name="Oversupply Risk" fill="#f06b6b" />
                  <Bar dataKey="liquidity_depth_score" name="Liquidity Depth Score" fill="#6d95ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Developer Reliability vs Execution Risk</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topDeveloperRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="developer_name" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="developer_reliability_score" name="Reliability Score" fill="#71d39a" />
                  <Line type="monotone" dataKey="execution_risk_score" name="Execution Risk Score" stroke="#f28a8a" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card wide">
            <h3>Layer 5: Deal Survival Probability vs Downside IRR</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={topDealRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="deal_name" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="survival_probability" name="Survival Probability %" fill="#72d9af" />
                  <Line type="monotone" dataKey="downside_irr" name="Downside IRR %" stroke="#ffb25c" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card">
            <h3>Institution Tracking</h3>
            <table>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Focus</th>
                  <th>Last Publication</th>
                </tr>
              </thead>
              <tbody>
                {macroInstitutions.map((row) => (
                  <tr key={row.institution}>
                    <td>{row.institution}</td>
                    <td>{row.focus}</td>
                    <td>{row.last_publication_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card">
            <h3>Other Firms Trackdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>Strategy Focus</th>
                  <th>Watch Level</th>
                </tr>
              </thead>
              <tbody>
                {peerFirmTracking.map((row) => (
                  <tr key={row.firm}>
                    <td>{row.firm}</td>
                    <td>{row.strategy_focus}</td>
                    <td className={`watch-pill ${phaseToneClass(row.watch_level === "low" ? "expansion" : row.watch_level === "medium" ? "neutral" : "contraction")}`}>
                      {row.watch_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card">
            <h3>City Ranking Clarity</h3>
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Attractiveness</th>
                  <th>Rotation Rank</th>
                  <th>Supply Risk</th>
                </tr>
              </thead>
              <tbody>
                {topCityRows.map((row) => (
                  <tr key={row.city}>
                    <td>{row.city}</td>
                    <td>{row.city_attractiveness_score}</td>
                    <td>{row.capital_rotation_ranking}</td>
                    <td>{row.supply_risk_band}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card">
            <h3>Alpha Zone Micro-Markets</h3>
            <table>
              <thead>
                <tr>
                  <th>Micro-market</th>
                  <th>Mispricing</th>
                  <th>Demand</th>
                  <th>Oversupply</th>
                  <th>Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {topMicroRows.map((row) => (
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
          </section>

          <section className="investor-card">
            <h3>Developer Intelligence</h3>
            <table>
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Reliability</th>
                  <th>Risk Band</th>
                  <th>Delay %</th>
                </tr>
              </thead>
              <tbody>
                {topDeveloperRows.map((row) => (
                  <tr key={row.developer_name}>
                    <td>{row.developer_name}</td>
                    <td>{row.developer_reliability_score}</td>
                    <td>{row.execution_risk_band}</td>
                    <td>{row.api_delivery_delay_pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card">
            <h3>Deal-Level Survival Engine</h3>
            <table>
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Survival Probability</th>
                  <th>Downside IRR</th>
                  <th>Capital Impairment</th>
                </tr>
              </thead>
              <tbody>
                {topDealRows.map((row) => (
                  <tr key={row.deal_name}>
                    <td>{row.deal_name}</td>
                    <td>{row.survival_probability}%</td>
                    <td>{row.downside_irr}%</td>
                    <td>{row.capital_impairment_band}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card">
            <h3>Capitalization Rate by Property Type</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workspace.cap_rate_by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="property_type" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="cap_rate_pct" fill="#cb77ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card">
            <h3>Investment Activity</h3>
            <div className="chart-h">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workspace.investment_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24435f" />
                  <XAxis dataKey="year" stroke="#8ba8c2" />
                  <YAxis stroke="#8ba8c2" />
                  <Tooltip />
                  <Bar dataKey="acquisition_b" fill={ACTIVITY_COLORS.acquisition_b} />
                  <Bar dataKey="disposition_b" fill={ACTIVITY_COLORS.disposition_b} />
                  <Bar dataKey="net_b" fill={ACTIVITY_COLORS.net_b} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="investor-card">
            <h3>Relationships</h3>
            <div className="relationship-tabs">
              {RELATIONSHIP_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={relationshipType === tab.id ? "is-active" : ""}
                  onClick={() => setRelationshipType(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>#Properties</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.properties}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card wide">
            <h3>Firm Holdings Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Properties Owned</th>
                  <th>Avg Property Price (USD M)</th>
                </tr>
              </thead>
              <tbody>
                {firmHoldingsRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.properties_owned}</td>
                    <td>{Number(row.avg_property_price_m).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="investor-card wide">
            <div className="investor-priority-head">
              <h3>Google Map: Firm Capital by Area</h3>
              <label>
                Firm
                <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  {firmHoldingsRows.map((row) => (
                    <option key={row.name} value={row.name}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <iframe
              className="firm-map-window"
              title="Firm Capital Map"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <p className="investor-muted">
              Click an area row below to move the Google Map window to that area and inspect investment concentration.
            </p>
            <div className="table-grid">
              <div>
                <h4>Area Priority by {selectedFirm}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>City</th>
                      <th>Priority</th>
                      <th>Invested Capital (USD B)</th>
                      <th>Google Map</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firmAreaRows.map((row) => (
                      <tr
                        key={`${selectedFirm}-${row.area}-priority`}
                        className={
                          selectedArea?.area === row.area && selectedArea?.city === row.city
                            ? "is-selected-row"
                            : ""
                        }
                        onClick={() => setSelectedArea(row)}
                      >
                        <td>{row.area}</td>
                        <td>{row.city}</td>
                        <td>{row.priority_score}</td>
                        <td>{Number(row.invested_capital_b || 0).toFixed(2)}</td>
                        <td>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${row.area}, ${row.city}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h4>Selected Area Detail</h4>
                {selectedArea ? (
                  <table>
                    <tbody>
                      <tr><td>Firm</td><td>{selectedFirm}</td></tr>
                      <tr><td>Area</td><td>{selectedArea.area}</td></tr>
                      <tr><td>City</td><td>{selectedArea.city}</td></tr>
                      <tr><td>Priority Score</td><td>{selectedArea.priority_score}</td></tr>
                      <tr><td>Invested Capital</td><td>{Number(selectedArea.invested_capital_b || 0).toFixed(2)} USD B</td></tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="investor-muted">Select a row to view area details.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="investor-card">
          <h3>{DASHBOARD_TABS.find((x) => x.id === activeTab)?.label}</h3>
          {tabRows.length === 0 ? (
            <p className="investor-muted">No rows found.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {Object.keys(tabRows[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabRows.map((row, idx) => (
                    <tr key={`${activeTab}-${idx}`}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
