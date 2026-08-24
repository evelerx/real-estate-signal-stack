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
  if (!config.enabled || !config.apiKey) {
    throw new Error("Save an enabled OpenRouter key before checking it.");
  }
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

export async function testOpenRouterConnection(token) {
  return runOpenRouterTest(token, {
    content: "Reply with exactly: OpenRouter connection verified.",
    maxTokens: 20,
    webSearch: false,
  });
}

export async function testOpenRouterWebResearch(token) {
  return runOpenRouterTest(token, {
    content: "Search the web for one current, cited real-estate market signal for Pune, India. Reply in two concise sentences and include source links.",
    maxTokens: 90,
    webSearch: true,
  });
}

async function runOpenRouterTest(token, { content, maxTokens, webSearch }) {
  const config = getOpenRouterConfig();
  if (!config.enabled || !config.apiKey) {
    throw new Error("Save an enabled OpenRouter key before running a test.");
  }
  if (config.localUsageUsd >= config.usageLimitUsd) {
    throw new Error("Local OpenRouter usage cap reached. Clear or replace the key configuration to continue.");
  }
  if (webSearch && config.usageLimitUsd - config.localUsageUsd < 0.005) {
    throw new Error("At least $0.005 of the local cap must remain for an OpenRouter web-search test.");
  }

  const res = await fetch("/api/openrouter/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Api-Key": config.apiKey,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content }],
      max_tokens: maxTokens,
      web_search: webSearch,
      local_usage_usd: config.localUsageUsd,
      local_limit_usd: config.usageLimitUsd,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "OpenRouter test request failed");
  }

  const payload = await res.json();
  const cost = Number(payload?.usage?.cost);
  const nextUsage = Number.isFinite(cost) && cost > 0
    ? Math.min(config.usageLimitUsd, config.localUsageUsd + cost)
    : config.localUsageUsd;
  saveOpenRouterConfig({ ...config, localUsageUsd: nextUsage });

  const annotations = Array.isArray(payload?.choices?.[0]?.message?.annotations)
    ? payload.choices[0].message.annotations.filter((item) => item?.type === "url_citation")
    : [];

  return {
    text: payload?.choices?.[0]?.message?.content || "",
    cost: Number.isFinite(cost) ? cost : null,
    localUsageUsd: nextUsage,
    citations: annotations.map((item) => ({
      title: item?.url_citation?.title || item?.url_citation?.url || "Cited source",
      url: item?.url_citation?.url || "",
    })),
  };
}
