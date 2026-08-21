export const AREA_CARDS = [
  {
    key: "capital_allocation_score",
    title: "Allocation Score",
    toneRule: (v) => v >= 70 ? "positive" : v >= 50 ? "warning" : "negative"
  },
  {
    key: "confidence",
    title: "Confidence",
    unit: "%",
    toneRule: (v) => v >= 75 ? "positive" : v >= 50 ? "warning" : "negative"
  },
  {
    key: "allocation_signal",
    title: "Signal",
    toneRule: (v) =>
      v === "GREEN" ? "positive" :
      v === "YELLOW" ? "warning" : "negative"
  }
];
