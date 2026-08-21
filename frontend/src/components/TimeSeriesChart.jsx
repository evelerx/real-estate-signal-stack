import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminAdjustmentOverlay from "./AdminAdjustmentOverlay";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceArea,
  Area,
} from "recharts";

import { fetchAreaTimeSeries } from "../services/api";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

/* ---------------- METRIC CONFIG ---------------- */
const METRICS = {
  score: { label: "Capital Score", color: "#22c55e", key: "score" },
  confidence: { label: "Confidence", color: "#3b82f6", key: "confidence" },
  risk: { label: "Risk", color: "#ef4444", key: "risk" },
};

function formatQuarter(q) {
  const [year, quarter] = q.split("-");
  return `${quarter} ${year}`;
}

export default function TimeSeriesChart({
  area,
  series = null,
  initialMetric = "score",
  showControls = true,
  showExportButtons = true,
  onExportPDF = null,
  titleSuffix = "Quarterly",
  showAdminOverlay = true,
}) {
  const { role } = useAuth();

  const [data, setData] = useState([]);
  const [metric, setMetric] = useState(initialMetric);
  const [adjustments, setAdjustments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartRef = useRef(null);
  const activeMetric = METRICS[metric];

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!area && !series) return;

    async function loadSeries() {
      try {
        setLoading(true);
        setError(null);

        if (series) {
          const sorted = [...series].sort((a, b) =>
            a.quarter.localeCompare(b.quarter)
          );
          setData(sorted);
          return;
        }

        const raw = await fetchAreaTimeSeries(area);
        setData(raw.sort((a, b) => a.quarter.localeCompare(b.quarter)));
      } catch (err) {
        setError(err?.message || "Failed to load time series");
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [area, series]);

  useEffect(() => {
    setMetric(initialMetric);
  }, [initialMetric]);

  /* ---------------- ADMIN ADJUSTED SERIES ---------------- */
  const isEditor = role === "admin";

  const adjustedData =
    isEditor
      ? data.map((d) => ({
          ...d,
          adjusted: d[activeMetric.key] + (adjustments[d.quarter] || 0),
        }))
      : data;

  /* ---------------- EXPORT ---------------- */
  async function exportPNG() {
    const img = await htmlToImage.toPng(chartRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.download = `${area}_${metric}.png`;
    a.href = img;
    a.click();
  }

  async function exportPDF() {
    const img = await htmlToImage.toPng(chartRef.current, { pixelRatio: 2 });
    const pdf = new jsPDF("landscape", "px", [900, 450]);
    pdf.addImage(img, "PNG", 20, 20, 860, 410);
    pdf.save(`${area}_${metric}.pdf`);
  }

  if (loading) return <div className="chart-box">Loading chart...</div>;
  if (error) return <div className="chart-box error">{error}</div>;
  if (!data.length) return <div className="chart-box">No historical data</div>;

  return (
    <div className="chart-box">
      <h3>
        {activeMetric.label} - {titleSuffix}
      </h3>

      {showControls && (
        <div className="metric-toggle">
          {Object.entries(METRICS).map(([k, m]) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={metric === k ? "active" : ""}
            >
              {m.label}
            </button>
          ))}
          {showExportButtons && (
            <>
              <button onClick={exportPNG}>PNG</button>
              <button onClick={onExportPDF || exportPDF}>PDF</button>
            </>
          )}
        </div>
      )}

      {isEditor && showAdminOverlay && (
        <AdminAdjustmentOverlay
          data={data}
          adjustments={adjustments}
          onChange={setAdjustments}
        />
      )}

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={adjustedData}>
            <XAxis dataKey="quarter" tickFormatter={formatQuarter} />
            <YAxis />
            <Tooltip
              formatter={(v, n) =>
                n === "confidence"
                  ? `${v}% - reduced by overrides & age`
                  : v.toFixed(2)
              }
              labelFormatter={formatQuarter}
            />

            {/* Confidence band */}
            <Area
              dataKey="confidence"
              fill="#3b82f6"
              fillOpacity={0.12}
              stroke="none"
            />

            <ReferenceArea y1={70} y2={100} fill="#16a34a" fillOpacity={0.08} />
            <ReferenceArea y1={50} y2={70} fill="#eab308" fillOpacity={0.08} />
            <ReferenceArea y1={0} y2={50} fill="#dc2626" fillOpacity={0.08} />

            <Line
              type="monotone"
              dataKey={activeMetric.key}
              stroke={activeMetric.color}
              strokeWidth={2}
            />

            {isEditor && (
              <Line
                type="monotone"
                dataKey="adjusted"
                stroke="#f97316"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            )}

            <Brush height={26} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
