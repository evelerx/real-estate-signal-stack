import { useEffect, useMemo, useState } from "react";
import MapboxDensityMap from "../components/MapboxDensityMap";
import { fetchAreaHeatmap } from "../services/api";
import "./Heatmap.css";

const LIVE_REFRESH_MS = 30_000;

export default function Heatmap() {
  const [rows, setRows] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [status, setStatus] = useState("Loading current area signals...");

  useEffect(() => {
    let active = true;
    let timerId = null;
    async function loadDensity() {
      try {
        const data = await fetchAreaHeatmap({}, { forceLive: true });
        if (!active) return;
        const nextRows = Array.isArray(data) ? data : [];
        setRows(nextRows);
        setStatus(nextRows.length ? `Live density updated for ${nextRows.length} tracked micro-markets.` : "No area signals are available.");
      } catch (error) {
        if (active) setStatus(error.message || "Could not load the area density data.");
      }
    }
    function startWhenVisible() {
      window.clearInterval(timerId);
      if (document.visibilityState !== "visible") return;
      loadDensity();
      timerId = window.setInterval(loadDensity, LIVE_REFRESH_MS);
    }
    startWhenVisible();
    document.addEventListener("visibilitychange", startWhenVisible);
    return () => { active = false; window.clearInterval(timerId); document.removeEventListener("visibilitychange", startWhenVisible); };
  }, []);

  const selectedLabel = useMemo(() => {
    if (!selectedArea) return "Select a visible point to inspect its micro-market score.";
    return `${selectedArea.name}, ${selectedArea.city}: ${Number(selectedArea.score).toFixed(1)} capital-allocation score.`;
  }, [selectedArea]);

  return (
    <main className="page heatmap-page">
      <header className="site-header">
        <div className="header-shell">
          <div className="brand"><span className="brand-mark">R</span><div><p className="brand-title">Real Estate Signal Stack</p><p className="brand-subtitle">Geographic market intelligence</p></div></div>
          <div className="header-actions"><a className="btn ghost" href="/admin">Admin Console</a></div>
        </div>
      </header>
      <section className="section">
        <div className="section-header"><p className="eyebrow">Density Map</p><h2>Where the strongest real-estate signals are concentrated.</h2><p>Heat intensity compares the capital-allocation score across the currently tracked micro-markets.</p></div>
        <div className="map-page-content"><MapboxDensityMap rows={rows} onSelect={setSelectedArea} /><p className="map-page-status" aria-live="polite">{status}</p><p className="map-page-selection" aria-live="polite">{selectedLabel}</p></div>
      </section>
    </main>
  );
}
