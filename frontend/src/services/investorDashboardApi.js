const DASHBOARD_BASE = "/api/dashboard";

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
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchDashboardWorkspace(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.geography) params.set("geography", filters.geography);
  if (filters.propertyType) params.set("property_type", filters.propertyType);
  if (filters.period) params.set("period", filters.period);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${DASHBOARD_BASE}/workspace${query}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchRelationships(token, relationshipType) {
  const params = new URLSearchParams();
  if (relationshipType) params.set("relationship_type", relationshipType);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${DASHBOARD_BASE}/relationships${query}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchDashboardTabData(token, tab) {
  const endpointByTab = {
    transactions: "/transactions",
    known_holdings: "/known-holdings",
    mortgage_debt: "/mortgage-debt",
  };

  const endpoint = endpointByTab[tab];
  if (!endpoint) throw new Error("Invalid dashboard tab");

  const res = await fetch(`${DASHBOARD_BASE}${endpoint}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function fetchIndiaMacroCapitalFlow(token) {
  const res = await fetch(`${DASHBOARD_BASE}/india-macro-capital-flow`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}
