const STORAGE_KEY = "google_data_config_v1";

const DEFAULT_CONFIG = {
  mapsApiKey: "",
  searchApiKey: "",
  searchEngineId: "d639f6a1b3f634ac0",
  enabled: false,
};

export function getGoogleDataConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    const mapsApiKey = String(parsed.mapsApiKey || "").trim();
    const searchApiKey = String(parsed.searchApiKey || "").trim();
    const searchEngineId = String(parsed.searchEngineId || DEFAULT_CONFIG.searchEngineId).trim();
    return {
      mapsApiKey,
      searchApiKey,
      searchEngineId,
      enabled: Boolean(parsed.enabled && mapsApiKey && searchApiKey && searchEngineId),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveGoogleDataConfig(config) {
  const next = {
    mapsApiKey: String(config.mapsApiKey || "").trim(),
    searchApiKey: String(config.searchApiKey || "").trim(),
    searchEngineId: String(config.searchEngineId || "").trim(),
    enabled: Boolean(config.enabled),
  };
  next.enabled = Boolean(next.enabled && next.mapsApiKey && next.searchApiKey && next.searchEngineId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("google-data-config:changed", { detail: next }));
  return next;
}

export function clearGoogleDataConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("google-data-config:changed", { detail: DEFAULT_CONFIG }));
  return DEFAULT_CONFIG;
}

export async function verifyGoogleDataConfig(token) {
  const config = getGoogleDataConfig();
  if (!config.enabled) {
    throw new Error("Save all enabled Google credentials before testing the connection.");
  }

  const res = await fetch("/api/google-data/verify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Google-Maps-Api-Key": config.mapsApiKey,
      "X-Google-Search-Api-Key": config.searchApiKey,
      "X-Google-Search-Engine-Id": config.searchEngineId,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "Google API verification failed");
  return body;
}
