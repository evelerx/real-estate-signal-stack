// src/components/Chart.jsx

import { useEffect, useState } from "react";
import { fetchAreaSnapshot } from "../services/api";

export default function Chart({ areaId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!areaId) return;

    fetchAreaSnapshot(areaId)
      .then(setData)
      .catch(console.error);
  }, [areaId]);

  if (!data) return <div>Loading analysis…</div>;

  const comp = data.score_composition;

  const bars = [
    { label: "Base Area Score", value: comp.base_area_score },
    { label: "City Macro Score", value: comp.city_macro_score },
    { label: "Risk Deduction", value: -comp.risk_deductions.total_deduction },
  ];

  return (
    <div className="chart">
      {bars.map((b) => (
        <div key={b.label} className="chart-row">
          <span>{b.label}</span>
          <div
            className="bar"
            style={{
              width: `${Math.abs(b.value)}%`,
              background: b.value >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            {b.value}
          </div>
        </div>
      ))}
    </div>
  );
}
