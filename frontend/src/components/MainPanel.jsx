import { useEffect, useState } from "react";
import SignalCard from "./SignalCard";
import { fetchAreaSnapshot } from "../services/api";

function MainPanel({ selectedArea }) {
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedArea) return;

    setLoading(true);
    setError(null);

fetchAreaSnapshot(selectedArea.toLowerCase())
      .then((data) => {
        setSignals(data);
      })
      .catch((err) => {
        console.error("Signal fetch failed:", err);
        setError("Unable to load signals");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedArea]);

  if (!selectedArea) {
    return (
      <div style={{ flex: 1, padding: "24px" }}>
        <h2>Signal Dashboard</h2>
        <p>Select an area to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "24px" }}>
        <h2>{selectedArea}</h2>
        <p>Loading signals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: "24px", color: "red" }}>
        <h2>{selectedArea}</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!signals) return null;

  return (
    <div style={{ flex: 1, padding: "24px" }}>
      <h2>{signals.area} — Signals</h2>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "16px",
          flexWrap: "wrap",
        }}
        
      >
        <SignalCard
  title="Capital Allocation Score"
  value={signals.capital_allocation_score.toFixed(1)}
  subtitle={`Bucket: ${signals.allocation_signal.bucket}`}
/>

<SignalCard
  title="Allocation Signal"
  value={signals.allocation_signal.signal}
  subtitle="Model recommendation"
/>

<SignalCard
  title="Confidence"
  value={
    signals.confidence !== undefined
      ? `${signals.confidence}%`
      : "—"
  }
  subtitle="Model certainty"
/>

<SignalCard
  title="Access Tier"
  value={signals.tier.toUpperCase()}
  subtitle={signals.status}
/>

<SignalCard
  title="City"
  value={signals.city}
  subtitle={`Snapshot ${signals.snapshot_version}`}
/>


      </div>
    </div>
  );
}

export default MainPanel;
