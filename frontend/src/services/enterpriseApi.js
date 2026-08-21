const BASE = "/api/enterprise";

async function handle(res) {
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

function auth(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchCityIntelligence(token) {
  return handle(await fetch(`${BASE}/city-intelligence`, { headers: auth(token) }));
}

export async function simulateCapitalAllocation(token, payload) {
  return handle(
    await fetch(`${BASE}/allocation/simulate`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(payload),
    })
  );
}

export async function modelDownside(token, payload) {
  return handle(
    await fetch(`${BASE}/risk/downside`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchDeveloperIntelligence(token) {
  return handle(await fetch(`${BASE}/developers/intelligence`, { headers: auth(token) }));
}

export async function generateIcMemo(token, payload) {
  return handle(
    await fetch(`${BASE}/ic/memo`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify(payload),
    })
  );
}

export async function fetchMacroOverview(token) {
  return handle(await fetch(`${BASE}/macro/overview`, { headers: auth(token) }));
}
