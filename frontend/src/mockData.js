import { indiaGeo } from "./data/indiaGeo";

function isApiOnlyArea(areaName) {
  return String(areaName || "").trim().toLowerCase() === "wakad";
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function scoreFromName(name, min = 45, max = 95) {
  const range = max - min;
  const hash = hashString(name);
  return min + (hash % range);
}

function buildQuarterSeries(base, variance = 8) {
  const quarters = ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4", "2025-Q1"];
  return quarters.map((q, idx) => ({
    quarter: q,
    score: Math.round(base + (idx - 2) * 1.8),
    confidence: Math.min(98, Math.max(55, base + variance - idx * 2)),
    risk: Math.max(12, 100 - (base + idx * 2)),
  }));
}

const areaSnapshots = {};
const cityMacros = {};
const heatmap = [];
const timeSeries = {};

indiaGeo.forEach((stateItem) => {
  stateItem.cities.forEach((cityItem) => {
    const cityScore = scoreFromName(cityItem.name, 50, 92);
    cityMacros[cityItem.name] = {
      score: cityScore,
      city: cityItem.name,
      state: stateItem.state,
    };

    cityItem.areas.forEach((areaName) => {
      if (isApiOnlyArea(areaName)) {
        return;
      }

      const areaScore = scoreFromName(`${cityItem.name}-${areaName}`, 48, 96);
      areaSnapshots[areaName] = {
        area: areaName,
        city: cityItem.name,
        state: stateItem.state,
        capital_allocation_score: areaScore,
        confidence: Math.min(98, Math.max(50, areaScore - 5)),
        allocation_signal: {
          signal: areaScore > 80 ? "Overweight" : areaScore > 65 ? "Monitor" : "Defensive",
        },
      };

      heatmap.push({
        id: `${cityItem.name}-${areaName}`,
        name: areaName,
        score: areaScore,
        city: cityItem.name,
        state: stateItem.state,
      });

      timeSeries[areaName] = buildQuarterSeries(areaScore);
    });
  });
});

const mockData = {
  areaSnapshots,
  cityMacros,
  heatmap,
  timeSeries,
};

export default mockData;
