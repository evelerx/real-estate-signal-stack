const STAFF_BASE = "/api/internal/staff";
const AUTH_BASE = "/api/auth";

function formatApiDetail(detail) {
  if (!detail) return "Request failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const lines = detail.map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const msg = item.msg || "Invalid value";
      const loc = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
      return loc ? `${loc}: ${msg}` : msg;
    });
    return lines.join(" | ");
  }
  if (typeof detail === "object") {
    if (typeof detail.message === "string") return detail.message;
    try {
      return JSON.stringify(detail);
    } catch {
      return "Request failed";
    }
  }
  return String(detail);
}

async function handleResponse(res) {
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
      throw new Error("Session expired or invalid token. Please log in again.");
    }
    let detail = "Request failed";
    try {
      const body = await res.json();
      detail = formatApiDetail(body.detail || body);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function loginStaff() {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin" }),
  });
  return handleResponse(res);
}

export async function fetchStaffUsers(token) {
  const res = await fetch(`${STAFF_BASE}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function createStaffUser(token, payload) {
  const res = await fetch(`${STAFF_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStaffUser(token, userId, payload) {
  const res = await fetch(`${STAFF_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStaffUser(token, userId) {
  const res = await fetch(`${STAFF_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}
