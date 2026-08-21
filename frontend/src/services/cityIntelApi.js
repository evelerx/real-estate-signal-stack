const CITY_INTEL_BASE = "/api/internal/intel/city-intelligence";
const MICRO_MARKET_BASE = "/api/internal/intel/micro-markets";

async function handleResponse(res) {
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
      throw new Error("Session expired or invalid token. Please log in again.");
    }
    let detail = "Request failed";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchCityIntelligenceInputs(token) {
  const res = await fetch(CITY_INTEL_BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function upsertCityIntelligenceInput(token, cityKey, payload) {
  const res = await fetch(`${CITY_INTEL_BASE}/${encodeURIComponent(cityKey)}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchMicroMarketEngine(token) {
  const res = await fetch(MICRO_MARKET_BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function upsertMicroMarketInput(token, cityKey, marketKey, payload) {
  const res = await fetch(
    `${MICRO_MARKET_BASE}/${encodeURIComponent(cityKey)}/${encodeURIComponent(marketKey)}`,
    {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(res);
}
