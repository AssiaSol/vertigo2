const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5096";

export async function apiFetch(path, options = {}) {
  const { headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || body.title || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = body;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
