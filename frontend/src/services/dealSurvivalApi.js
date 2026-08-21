const DEAL_SURVIVAL_BASE = "/api/internal/intel/deal-survival";

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

export async function fetchDealSurvivalLayer(token) {
  const res = await fetch(DEAL_SURVIVAL_BASE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function upsertDealSurvivalManual(token, dealKey, payload) {
  const res = await fetch(`${DEAL_SURVIVAL_BASE}/${encodeURIComponent(dealKey)}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
