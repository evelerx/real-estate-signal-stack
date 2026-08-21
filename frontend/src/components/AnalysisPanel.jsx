import { useEffect, useRef, useState } from "react";
import {
  fetchAreaSnapshot,
  fetchAreaTimeSeries,
  fetchCityMacro,
} from "../services/api";
import { getIntelByArea } from "../services/localIntel";
import HeatMap from "./HeatMap";
import TimeSeriesChart from "./TimeSeriesChart";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

const LIVE_REFRESH_MS = 30_000;

function formatDate(date = new Date()) {
  return date.toLocaleDateString();
}

function formatValue(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }
  return Number(value).toFixed(digits);
}

function classifyScore(score) {
  if (score >= 80) return "High";
  if (score >= 65) return "Moderate";
  return "Low";
}

function classifyRisk(risk) {
  if (risk >= 70) return "High";
  if (risk >= 40) return "Moderate";
  return "Low";
}

function classifyConfidence(confidence) {
  if (confidence >= 80) return "Strong";
  if (confidence >= 60) return "Moderate";
  return "Low";
}

export default function AnalysisPanel({ selection }) {
  const { city, area, state } = selection;

  const [areaData, setAreaData] = useState(null);
  const [cityMacro, setCityMacro] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("cards"); // cards | chart | heatmap
  const [exporting, setExporting] = useState(false);
  const [localIntel, setLocalIntel] = useState({
    listings: [],
    brokerDeals: [],
    validations: [],
  });

  const reportRef = useRef(null);

  useEffect(() => {
    if (!area && !city && !state) {
      setAreaData(null);
      setCityMacro(null);
      setTimeSeries([]);
      setHeatmapData(null);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (area) {
          const areaRes = await fetchAreaSnapshot(area);
          setAreaData(areaRes);
        } else {
          setAreaData(null);
          setTimeSeries([]);
        }

        if (city) {
          const cityRes = await fetchCityMacro(city, area);
          setCityMacro(cityRes);
        } else {
          setCityMacro(null);
        }

        setHeatmapData(null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [area, city, state]);

  useEffect(() => {
    if (view !== "chart" || !area) return undefined;

    let cancelled = false;
    let intervalId = null;

    async function loadLiveSeries() {
      try {
        setError(null);
        const seriesRes = await fetchAreaTimeSeries(area, { forceLive: true });
        if (!cancelled) {
          setTimeSeries(Array.isArray(seriesRes) ? seriesRes : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Failed to refresh live chart data");
        }
      }
    }

    loadLiveSeries();
    intervalId = window.setInterval(loadLiveSeries, LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [area, view]);

  useEffect(() => {
    if (!area) {
      setLocalIntel({ listings: [], brokerDeals: [], validations: [] });
      return;
    }
    setLocalIntel(getIntelByArea(area));
  }, [area]);

  async function exportReport() {
    try {
      setExporting(true);
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      if (!reportRef.current) return;

      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "pt", "a4");
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (img.height * imgWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeArea = area ? area.replace(/\s+/g, "_") : "area";
      pdf.save(`${safeArea}_signal_report.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (!area && !city) {
    return <div className="panel">Select a city or area to view analysis</div>;
  }

  if (loading) {
    return <div className="panel">Loading analysis...</div>;
  }

  if (error) {
    return <div className="panel error">Error: {error}</div>;
  }

  const latestPoint = timeSeries.length ? timeSeries[timeSeries.length - 1] : null;
  const scoreValue = latestPoint?.score ?? areaData?.capital_allocation_score ?? null;
  const confidenceValue = latestPoint?.confidence ?? areaData?.confidence ?? null;
  const riskValue = latestPoint?.risk ?? null;

  const scoreTier = scoreValue !== null ? classifyScore(scoreValue) : "N/A";
  const confidenceTier =
    confidenceValue !== null ? classifyConfidence(confidenceValue) : "N/A";
  const riskTier = riskValue !== null ? classifyRisk(riskValue) : "N/A";

  const riskBenefitSummary =
    riskValue !== null && scoreValue !== null
      ? riskValue >= 70 && scoreValue < 65
        ? "High risk, lower upside: priced for uncertainty or oversupply."
        : riskValue < 40 && scoreValue >= 80
          ? "Lower risk, strong upside: fundamentals and demand are aligned."
          : "Balanced risk/benefit: monitor changes in supply or macro shocks."
      : "Risk/benefit summary will appear once the latest quarter is loaded.";

  const areaHeatmapData = Array.isArray(heatmapData)
    ? heatmapData.filter((item) => {
        const name = String(item?.name ?? item?.area ?? "").toLowerCase();
        const id = String(item?.id ?? "").toLowerCase();
        const areaKey = area?.toLowerCase() ?? "";
        return (
          name === areaKey || id === areaKey || id.endsWith(`-${areaKey}`)
        );
      })
    : [];

  const firstPoint = timeSeries.length ? timeSeries[0] : null;
  const scoreDelta =
    firstPoint && latestPoint
      ? Number(latestPoint.score) - Number(firstPoint.score)
      : null;
  const confidenceDelta =
    firstPoint && latestPoint
      ? Number(latestPoint.confidence) - Number(firstPoint.confidence)
      : null;
  const trendLabel =
    scoreDelta === null
      ? "Not available"
      : scoreDelta > 1
        ? "Improving trajectory"
        : scoreDelta < -1
          ? "Cooling trajectory"
          : "Stable trajectory";
  const convictionLabel =
    scoreTier === "High" && confidenceTier === "Strong" && riskTier !== "High"
      ? "High-conviction candidate"
      : scoreTier === "Moderate" || confidenceTier === "Moderate"
        ? "Selective allocation candidate"
        : "Watchlist candidate";
  const reportId = `ASC-${(area || "AREA").replace(/\s+/g, "-").toUpperCase()}-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;

  return (
    <div className="panel">
      {/* VIEW SWITCH */}
      <div className="view-switch">
        <button onClick={() => setView("cards")}>Cards</button>
        <button onClick={() => setView("chart")}>Charts</button>
        <button onClick={() => setView("heatmap")}>HeatMap</button>
      </div>
      {exporting && <div className="report-status">Preparing report...</div>}
      {view === "chart" && area && (
        <div className="report-status">
          Live chart refresh active. Fetching every 30 seconds while this view is open.
        </div>
      )}

      {/* CARDS VIEW */}
      {view === "cards" && areaData && (
        <>
          <h2>{areaData.area} - Area Snapshot</h2>
          <p>City: {areaData.city}</p>
          <p>Score: {areaData.capital_allocation_score}</p>
          <p>Confidence: {areaData.confidence}%</p>
          <p>Signal: {areaData.allocation_signal.signal}</p>
        </>
      )}

      {/* CHART VIEW */}
      {view === "chart" && area && (
        <>
          <div className="report-section">
            <button onClick={exportReport} disabled={exporting}>
              Download Full Area PDF Report
            </button>
          </div>
          <div className="report-charts">
            <TimeSeriesChart
              area={area}
              series={timeSeries}
              initialMetric="score"
              showControls={false}
              showExportButtons={false}
              showAdminOverlay={false}
              titleSuffix="Capital Score"
            />
            <TimeSeriesChart
              area={area}
              series={timeSeries}
              initialMetric="confidence"
              showControls={false}
              showExportButtons={false}
              showAdminOverlay={false}
              titleSuffix="Confidence"
            />
            <TimeSeriesChart
              area={area}
              series={timeSeries}
              initialMetric="risk"
              showControls={false}
              showExportButtons={false}
              showAdminOverlay={false}
              titleSuffix="Risk"
            />
          </div>
        </>
      )}

      {/* HEATMAP VIEW */}
      {view === "heatmap" && (
        <HeatMap scope={selection} data={heatmapData} />
      )}

      {/* CITY MACRO ALWAYS VISIBLE */}
      {cityMacro && view === "cards" && (
        <>
          <h3>City Macro</h3>
          <p>Macro Score: {cityMacro.score}</p>
        </>
      )}

      {view === "cards" && area && (
        <div className="local-intel">
          <h3>Local Intel (Manual)</h3>
          <div className="intel-block">
            <h4>Developer Listings</h4>
            {localIntel.listings.length === 0 ? (
              <p>No listings yet.</p>
            ) : (
              <ul>
                {localIntel.listings.map((item, index) => (
                  <li key={`${item.project}-${index}`}>
                    {item.company} - {item.project} ({item.stage || "Stage N/A"})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="intel-block">
            <h4>Broker Submitted Deals</h4>
            {localIntel.brokerDeals.length === 0 ? (
              <p>No broker deals yet.</p>
            ) : (
              <ul>
                {localIntel.brokerDeals.map((item, index) => (
                  <li key={`${item.asset}-${index}`}>
                    {item.asset} - {item.status || "Status N/A"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="intel-block">
            <h4>On-Demand Validations</h4>
            {localIntel.validations.length === 0 ? (
              <p>No validations yet.</p>
            ) : (
              <ul>
                {localIntel.validations.map((item, index) => (
                  <li key={`${item.summary}-${index}`}>
                    {item.summary} ({item.trend || "Trend N/A"})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {exporting && area && timeSeries.length > 0 && areaData && (
        <div className="report-export">
          <div className="report-shell" ref={reportRef}>
            <div className="report-masthead">
              <div>
                <p className="report-brand">Apex Signal Capital</p>
                <p className="report-eyebrow">Institutional Allocation Research</p>
              </div>
              <div className="report-meta">
                <div>
                  <span>Report ID</span>
                  <strong>{reportId}</strong>
                </div>
                <div>
                  <span>Generated</span>
                  <strong>{formatDate()}</strong>
                </div>
                <div>
                  <span>Coverage</span>
                  <strong>{areaData.area}, {areaData.city}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h1>{areaData.area} Allocation Report</h1>
              <p className="report-lead">
                {convictionLabel}. {trendLabel}. This memo blends corridor-level fundamentals,
                macro regime signals, and near-term risk dispersion for decision-grade
                allocation review.
              </p>
            </div>

            <div className="report-kpi-grid">
              <div className="report-kpi">
                <span>Capital Allocation Score</span>
                <strong>{formatValue(areaData.capital_allocation_score, 1)}</strong>
              </div>
              <div className="report-kpi">
                <span>Signal</span>
                <strong>{areaData.allocation_signal.signal}</strong>
              </div>
              <div className="report-kpi">
                <span>Confidence</span>
                <strong>{formatValue(areaData.confidence, 1)}%</strong>
              </div>
              <div className="report-kpi">
                <span>Risk (Latest Quarter)</span>
                <strong>{formatValue(riskValue, 1)}</strong>
              </div>
              <div className="report-kpi">
                <span>Score Delta</span>
                <strong>{scoreDelta === null ? "N/A" : `${scoreDelta > 0 ? "+" : ""}${formatValue(scoreDelta, 1)}`}</strong>
              </div>
              <div className="report-kpi">
                <span>Confidence Delta</span>
                <strong>
                  {confidenceDelta === null
                    ? "N/A"
                    : `${confidenceDelta > 0 ? "+" : ""}${formatValue(confidenceDelta, 1)}`}
                </strong>
              </div>
            </div>

            <div className="report-section">
              <h3>Investment Readout</h3>
              <div className="report-columns">
                <div className="report-card">
                  <h4>Recommendation</h4>
                  <p>{convictionLabel}</p>
                  <p>{riskBenefitSummary}</p>
                </div>
                <div className="report-card">
                  <h4>Market Posture</h4>
                  <p>Benefit: {scoreTier} | Confidence: {confidenceTier} | Risk: {riskTier}</p>
                  <p>Primary stance: {areaData.allocation_signal.signal}</p>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Trend Analytics</h3>
              <div className="report-charts">
                <TimeSeriesChart
                  area={area}
                  series={timeSeries}
                  initialMetric="score"
                  showControls={false}
                  showExportButtons={false}
                  showAdminOverlay={false}
                  titleSuffix="Capital Score"
                />
                <TimeSeriesChart
                  area={area}
                  series={timeSeries}
                  initialMetric="confidence"
                  showControls={false}
                  showExportButtons={false}
                  showAdminOverlay={false}
                  titleSuffix="Confidence"
                />
                <TimeSeriesChart
                  area={area}
                  series={timeSeries}
                  initialMetric="risk"
                  showControls={false}
                  showExportButtons={false}
                  showAdminOverlay={false}
                  titleSuffix="Risk"
                />
              </div>
            </div>

            <div className="report-section">
              <h3>Relative Positioning Heatmap</h3>
              <HeatMap scope={selection} data={areaHeatmapData} />
            </div>

            <div className="report-section">
              <h3>Evidence Framework</h3>
              <ul>
                <li>Composite model blends macro cycles, local fundamentals, and transaction velocity.</li>
                <li>Confidence score accounts for analyst overrides, data age, and volatility bands.</li>
                <li>Heatmap scores cross-validate area performance against city-wide distribution.</li>
                <li>Manual intel entries are time-stamped and tied to the selected corridor.</li>
              </ul>
            </div>

            <div className="report-section">
              <h3>Price Drivers</h3>
              <ul>
                <li>Absorption velocity, inventory turnover, and new supply pipelines.</li>
                <li>Infrastructure delivery, connectivity upgrades, and transit adjacency.</li>
                <li>Credit availability, rate regime, and local liquidity conditions.</li>
                <li>Household income growth, office hiring signals, and migration flows.</li>
              </ul>
            </div>

            <div className="report-section">
              <h3>Risk / Benefit Bands</h3>
              <p>
                Current view: {riskBenefitSummary}
              </p>
              <div className="report-range-grid">
                <div>
                  <span>Benefit Range</span>
                  <strong>High: 80-100</strong>
                  <strong>Moderate: 65-79</strong>
                  <strong>Low: 0-64</strong>
                </div>
                <div>
                  <span>Risk Range</span>
                  <strong>High: 70-100</strong>
                  <strong>Moderate: 40-69</strong>
                  <strong>Low: 0-39</strong>
                </div>
                <div>
                  <span>Latest Snapshot</span>
                  <strong>Benefit: {scoreTier}</strong>
                  <strong>Confidence: {confidenceTier}</strong>
                  <strong>Risk: {riskTier}</strong>
                </div>
              </div>
            </div>

            <div className="report-footer">
              <p>
                Confidential institutional research prepared by Apex Signal Capital. This
                document supports evaluation workflows and does not constitute investment advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
