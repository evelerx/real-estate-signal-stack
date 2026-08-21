const BASE = "/api/public";

async function handle(res) {
  if (!res.ok) {
    let detail = "Failed to submit consultation request";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function createConsultationRequest(payload) {
  const res = await fetch(`${BASE}/consultations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}
