const STORAGE_KEY = "live_data_api_config_v1";

const DEFAULT_CONFIG = {
  provider: "google_maps",
  apiKey: "",
  enabled: false,
};

export function getLiveDataConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || DEFAULT_CONFIG.provider,
      apiKey: parsed.apiKey || "",
      enabled: Boolean(parsed.enabled && parsed.apiKey),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveLiveDataConfig(config) {
  const next = {
    provider: config.provider || DEFAULT_CONFIG.provider,
    apiKey: String(config.apiKey || "").trim(),
    enabled: Boolean(config.enabled && String(config.apiKey || "").trim()),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("live-data-config:changed", { detail: next }));
  return next;
}

export function clearLiveDataConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("live-data-config:changed", { detail: DEFAULT_CONFIG })
  );
  return DEFAULT_CONFIG;
}

export function hasLiveDataApiKey() {
  const config = getLiveDataConfig();
  return Boolean(config.enabled && config.apiKey);
}

export function liveDataHeaders() {
  const config = getLiveDataConfig();
  if (!config.enabled || !config.apiKey) return {};
  return {
    "X-Live-Data-Provider": config.provider,
    "X-Live-Data-Api-Key": config.apiKey,
  };
}
