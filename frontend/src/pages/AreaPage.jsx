import { useEffect, useState } from "react";
import { fetchArea } from "../api";
import SignalGrid from "../components/SignalGrid";

export default function AreaPage({ areaKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
  setLoading(true);
  setError(false);

  fetchArea(areaKey)
    .then((res) => {
      setData({
        status: res.status,
        allocation_score: res.capital_allocation_score,
        risk_index: res.risk_deductions?.total_deduction,
        confidence: res.final_adjustment_factor,
        growth_stage: res.score_composition?.city_macro_score
      });
      setLoading(false);
    })
    .catch(() => {
      setError(true);
      setLoading(false);
    });
}, [areaKey]);



  if (loading) {
    return <div className="text-gray-400">Loading signals…</div>;
  }

  if (error || !data) {
    return (
      <div className="text-red-500 font-semibold">
        Unable to load signals
      </div>
    );
  }

  return <SignalGrid data={data} />;
}
