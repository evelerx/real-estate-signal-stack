export default function ConfidenceBadge({ value }) {
  let label = "Low";
  let color = "bg-red-500/20 text-red-300";

  if (value >= 75) {
    label = "High";
    color = "bg-green-500/20 text-green-300";
  } else if (value >= 50) {
    label = "Medium";
    color = "bg-amber-500/20 text-amber-300";
  }

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${color}`}>
      {label} Confidence
    </span>
  );
}
