import mockData from "../mockData";

const USE_MOCKS = true;
const API_BASE = "/api";
const BASE_URL = "/api";
const API_ONLY_AREAS = new Set(["wakad"]);

function normalizeArea(value = "") {
  return String(value).trim().toLowerCase();
}

function isApiOnlyArea(area) {
  return API_ONLY_AREAS.has(normalizeArea(area));
}

/* ---------------- INTERNAL HELPER ---------------- */
async function handleResponse(res, fallbackMessage) {
  if (!res.ok) {
    let detail = fallbackMessage;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

/* ---------------- AREA SNAPSHOT ---------------- */
export async function fetchAreaSnapshot(areaId, version = null) {
  const apiOnly = isApiOnlyArea(areaId);

  if (USE_MOCKS && !apiOnly) {
    const fallback = mockData.areaSnapshots[areaId];
    if (!fallback) throw new Error("Area not found in mock data");
    return fallback;
  }

  const query = version ? `?version=${encodeURIComponent(version)}` : "";
  const url = `${BASE_URL}/areas/${encodeURIComponent(areaId)}${query}`;

  try {
    const res = await fetch(url);
    return handleResponse(res, "Failed to fetch area snapshot");
  } catch (err) {
    if (apiOnly) throw err;
    const fallback = mockData.areaSnapshots[areaId];
    if (!fallback) throw err;
    return fallback;
  }
}

/* ---------------- HEATMAP (SINGLE SOURCE OF TRUTH) ---------------- */
export async function fetchAreaHeatmap(scope = {}) {
  const apiOnly = isApiOnlyArea(scope.area);

  if (USE_MOCKS && !apiOnly) {
    let data = mockData.heatmap;
    if (scope.state) {
      data = data.filter((item) => item.state === scope.state);
    }
    if (scope.city) {
      data = data.filter((item) => item.city === scope.city);
    }
    return data;
  }

  const params = new URLSearchParams();

  if (scope.city) params.append("city", scope.city);
  if (scope.state) params.append("state", scope.state);
  if (scope.area) params.append("area", scope.area);

  const query = params.toString();
  const url = query
    ? `${BASE_URL}/heatmap/areas?${query}`
    : `${BASE_URL}/heatmap/areas`;

  try {
    const res = await fetch(url);
    return handleResponse(res, "Failed to fetch heatmap data");
  } catch (err) {
    if (apiOnly) throw err;
    let data = mockData.heatmap;
    if (scope.state) {
      data = data.filter((item) => item.state === scope.state);
    }
    if (scope.city) {
      data = data.filter((item) => item.city === scope.city);
    }
    if (!data.length) throw err;
    return data;
  }
}

/* ---------------- CITY MACRO ---------------- */
export async function fetchCityMacro(cityId, areaId = null) {
  const apiOnly = isApiOnlyArea(areaId);

  if (USE_MOCKS && !apiOnly) {
    const fallback = mockData.cityMacros[cityId];
    if (!fallback) throw new Error("City not found in mock data");
    return fallback;
  }

  try {
    const res = await fetch(`${BASE_URL}/cities/${cityId}/macro`);
    return handleResponse(res, "Failed to fetch city macro");
  } catch (err) {
    if (apiOnly) throw err;
    const fallback = mockData.cityMacros[cityId];
    if (!fallback) throw err;
    return fallback;
  }
}

/* ---------------- TIME SERIES ---------------- */
export async function fetchAreaTimeSeries(area) {
  const apiOnly = isApiOnlyArea(area);

  if (USE_MOCKS && !apiOnly) {
    const fallback = mockData.timeSeries[area];
    if (!fallback) throw new Error("Area not found in mock data");
    return fallback;
  }

  try {
    const res = await fetch(
      `${API_BASE}/timeseries/areas?area=${encodeURIComponent(area)}`
    );
    return handleResponse(res, "Failed to fetch time series");
  } catch (err) {
    if (apiOnly) throw err;
    const fallback = mockData.timeSeries[area];
    if (!fallback) throw err;
    return fallback;
  }
}


/* ---------------- ANALYST ADJUSTMENTS ---------------- */
export async function saveAnalystAdjustments(area, adjustments) {
  if (USE_MOCKS) {
    return { ok: true, area, adjustments };
  }

  const res = await fetch(`${API_BASE}/internal/analyst/adjustments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ area, adjustments }),
  });

  return handleResponse(res, "Failed to save analyst adjustments");
}

/* ---------------- ANALYST NOTES ---------------- */
export async function saveAnalystNote({
  area,
  quarter,
  note,
  snapshotVersion,
  analystId,
}) {
  if (USE_MOCKS) {
    return { ok: true, area, quarter, note, snapshotVersion, analystId };
  }

  const res = await fetch(
    `${API_BASE}/internal/analyst/area/${area}/notes` +
      `?snapshot_version=${snapshotVersion}&analyst_id=${analystId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarter, note }),
    }
  );

  return handleResponse(res, "Failed to save analyst note");
}

