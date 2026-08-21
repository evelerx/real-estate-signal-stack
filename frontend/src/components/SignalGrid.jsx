import { SIGNAL_EXPLANATIONS } from "../config/signalExplanations";
import SignalCard from "./SignalCard";
import { AREA_CARDS } from "../config/cardDefinitions";

export default function SignalGrid({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {AREA_CARDS.map((card) => {
        const value = data[card.key];
        if (value === undefined) return null;

        const tone = card.toneRule
          ? card.toneRule(value)
          : "neutral";

        return (
          <SignalCard
            key={card.key}
            title={card.title}
            value={value}
            unit={card.unit}
            tone={tone}
            subtitle={SIGNAL_EXPLANATIONS[card.key]}
            status={data.status === "unlocked" ? "UNLOCKED" : "LOCKED"}
          />
        );
      })}
    </div>
  );
}
