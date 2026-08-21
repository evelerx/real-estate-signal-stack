import Tooltip from "./Tooltip.jsx";;

export default function SignalCard({
  title,
  value,
  subtitle,
  tone = "neutral",
  unit,
  status
}) {
  const toneMap = {
    positive: "text-green-400 border-green-500/30",
    warning: "text-amber-400 border-amber-500/30",
    negative: "text-red-400 border-red-500/30",
    neutral: "text-gray-300 border-gray-700"
  };

  return (
    <div
      className={`border rounded-xl p-4 bg-gray-900 transition hover:border-gray-500 ${toneMap[tone]}`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <Tooltip text={subtitle || "Signal explanation"}>
          <h3 className="text-sm font-semibold text-gray-400 cursor-help">
            {title}
          </h3>
        </Tooltip>

        {status && (
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium
              ${
                status === "UNLOCKED"
                  ? "bg-green-900/40 text-green-300"
                  : "bg-gray-800 text-gray-400"
              }
            `}
          >
            {status}
          </span>
        )}
      </div>

      {/* VALUE */}
      <div className="mt-2 text-3xl font-bold">
        {value}
        {unit && (
          <span className="text-sm ml-1 font-normal text-gray-400">
            {unit}
          </span>
        )}
      </div>

      {/* SUBTITLE */}
      {subtitle && (
        <div className="mt-1 text-xs text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}
