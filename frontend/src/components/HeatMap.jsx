import { useEffect, useState } from "react";
import { fetchAreaHeatmap } from "../services/api";

function scoreToColor(score, min, max) {
  const t = (score - min) / (max - min || 1);
  const hue = 120 * t; // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 45%)`;
}

function HeatmapLegend() {
  return (
    <div className="heatmap-legend">
      <span>Low</span>
      <div className="legend-gradient" />
      <span>High</span>
    </div>
  );
}

export default function HeatMap({ scope = {}, data: dataOverride = null }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dataOverride !== null) {
      setData(Array.isArray(dataOverride) ? dataOverride : []);
      return;
    }

    async function loadHeatmap() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchAreaHeatmap(scope);

        // HARD GUARANTEE ARRAY
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load heatmap data");
      } finally {
        setLoading(false);
      }
    }

    loadHeatmap();
  }, [scope?.city, scope?.state, dataOverride]);

  if (loading) return <div className="heatmap-box">Loading heatmap...</div>;
  if (error) return <div className="heatmap-box error">{error}</div>;
  if (!data.length) return <div className="heatmap-box">No heatmap data</div>;

  // backend provides `score`
  const scores = data.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  return (
    <div className="heatmap-box">
      <h3>Area Heat Map</h3>
      <HeatmapLegend />

      <div className="heatmap-grid">
        {data.map((item) => (
          <div
            key={item.id}
            className="heat-cell"
            style={{
              backgroundColor: scoreToColor(item.score, min, max),
            }}
          >
            <div>{item.name}</div>
            <strong>{item.score.toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
