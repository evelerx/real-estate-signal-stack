export default function SnapshotSelector({
  value,
  onChange,
  locked
}) {
  const snapshots = ["2024_Q3", "2024_Q4"];

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-xs text-gray-400">Snapshot:</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
      >
        {snapshots.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {locked && (
        <span className="text-xs text-amber-400">
          Upgrade to unlock historical data
        </span>
      )}
    </div>
  );
}
