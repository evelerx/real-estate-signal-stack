import mockData from "../mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function fetchAreaHeatmap({ city, state }) {
  if (USE_MOCK) {
    return mockData.heatmap;
  }

  const params = new URLSearchParams();
  if (city) params.append("city", city);
  if (state) params.append("state", state);

  const res = await fetch(
    `/areas/heatmap?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to load heatmap");
  }

  return res.json();
}
