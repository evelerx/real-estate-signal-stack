export default function AttributionPanel({ composition }) {
  return (
    <div className="border rounded-xl p-4 bg-gray-950">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        Signal Attribution
      </h3>

      <div className="space-y-2 text-sm">
        <div>City Macro: {composition.city_macro_score}</div>
        <div>Base Area Score: {composition.base_area_score}</div>
        <div>Area Adjustment: {composition.area_adjustment_factor}</div>
        <div>Admin Delta: {composition.analyst_adjustment_delta}</div>
        <div>Risk Deduction: {composition.risk_deductions.total_deduction}</div>
      </div>
    </div>
  );
}
