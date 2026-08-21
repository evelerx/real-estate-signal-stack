const STORAGE_KEY = "openrouter_config_v1";
const DEFAULT_USAGE_LIMIT_USD = 0.008;

const DEFAULT_CONFIG = {
  apiKey: "",
  model: "openrouter/auto",
  enabled: false,
  usageLimitUsd: DEFAULT_USAGE_LIMIT_USD,
  localUsageUsd: 0,
};

function toMoney(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getOpenRouterConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || "",
      model: parsed.model || DEFAULT_CONFIG.model,
      enabled: Boolean(parsed.enabled && parsed.apiKey),
      usageLimitUsd: toMoney(parsed.usageLimitUsd, DEFAULT_USAGE_LIMIT_USD),
      localUsageUsd: toMoney(parsed.localUsageUsd, 0),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveOpenRouterConfig(config) {
  const next = {
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || DEFAULT_CONFIG.model).trim(),
    enabled: Boolean(config.enabled && String(config.apiKey || "").trim()),
    usageLimitUsd: toMoney(config.usageLimitUsd, DEFAULT_USAGE_LIMIT_USD),
    localUsageUsd: toMoney(config.localUsageUsd, 0),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("openrouter-config:changed", { detail: next }));
  return next;
}

export function clearOpenRouterConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("openrouter-config:changed", { detail: DEFAULT_CONFIG })
  );
  return DEFAULT_CONFIG;
}

export async function fetchOpenRouterKeyStatus(token) {
  const config = getOpenRouterConfig();
  const res = await fetch("/api/openrouter/key-status", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-OpenRouter-Api-Key": config.apiKey,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to check OpenRouter key");
  }
  return res.json();
}
