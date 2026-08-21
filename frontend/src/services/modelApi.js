const MODEL_BASE = "/api/model";

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

export async function fetchModelMethodology() {
  const res = await fetch(`${MODEL_BASE}/methodology`);
  return handleResponse(res, "Failed to fetch model methodology");
}

export async function fetchModelAudit() {
  const res = await fetch(`${MODEL_BASE}/audit`);
  return handleResponse(res, "Failed to fetch model audit");
}

export async function fetchModelTraceability() {
  const res = await fetch(`${MODEL_BASE}/traceability`);
  return handleResponse(res, "Failed to fetch model traceability");
}
