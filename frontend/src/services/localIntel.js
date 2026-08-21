const STORAGE_KEY = "local-intel:v1";
const INTEL_BASE = "/api/internal/intel";

function loadStore() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function ensureArea(store, area) {
  if (!store[area]) {
    store[area] = { listings: [], brokerDeals: [], validations: [] };
  }
  return store[area];
}

async function handleResponse(res) {
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    throw new Error("Intel request failed");
  }
  return res.json();
}

function authHeaders(token) {
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function loadIntelByArea(area, token) {
  if (!token || !area) return getIntelByArea(area);
  try {
    const res = await fetch(`${INTEL_BASE}/${encodeURIComponent(area)}`, {
      headers: authHeaders(token),
    });
    const payload = await handleResponse(res);
    const store = loadStore();
    store[area] = payload;
    saveStore(store);
    return payload;
  } catch {
    return getIntelByArea(area);
  }
}

export async function syncIntelByArea(area, token) {
  if (!token || !area) return getIntelByArea(area);
  const payload = getIntelByArea(area);
  try {
    await fetch(`${INTEL_BASE}/${encodeURIComponent(area)}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  } catch {
    // Keep local fallback when backend sync is unavailable.
  }
  return payload;
}

export function addListing({ area, company, project, stage, priceRange }) {
  const store = loadStore();
  const entry = ensureArea(store, area);

  entry.listings.unshift({
    company,
    project,
    stage,
    priceRange,
    addedAt: new Date().toISOString(),
  });

  saveStore(store);
}

export function updateListing(area, index, updates) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  if (!entry.listings[index]) return;
  entry.listings[index] = { ...entry.listings[index], ...updates };
  saveStore(store);
}

export function removeListing(area, index) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  entry.listings.splice(index, 1);
  saveStore(store);
}

export function addBrokerDeal({ area, broker, asset, status, price, notes }) {
  const store = loadStore();
  const entry = ensureArea(store, area);

  entry.brokerDeals.unshift({
    broker,
    asset,
    status,
    price,
    notes,
    addedAt: new Date().toISOString(),
  });

  saveStore(store);
}

export function updateBrokerDeal(area, index, updates) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  if (!entry.brokerDeals[index]) return;
  entry.brokerDeals[index] = { ...entry.brokerDeals[index], ...updates };
  saveStore(store);
}

export function removeBrokerDeal(area, index) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  entry.brokerDeals.splice(index, 1);
  saveStore(store);
}

export function addValidation({ area, summary, trend, confidence, source }) {
  const store = loadStore();
  const entry = ensureArea(store, area);

  entry.validations.unshift({
    summary,
    trend,
    confidence,
    source,
    addedAt: new Date().toISOString(),
  });

  saveStore(store);
}

export function updateValidation(area, index, updates) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  if (!entry.validations[index]) return;
  entry.validations[index] = { ...entry.validations[index], ...updates };
  saveStore(store);
}

export function removeValidation(area, index) {
  const store = loadStore();
  const entry = ensureArea(store, area);
  entry.validations.splice(index, 1);
  saveStore(store);
}

export function getIntelByArea(area) {
  if (!area) return { listings: [], brokerDeals: [], validations: [] };
  const store = loadStore();
  return store[area] || { listings: [], brokerDeals: [], validations: [] };
}
