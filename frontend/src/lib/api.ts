// API istemcisi. Base URL VITE_API_URL'den; boşsa lokal backend.
// Dev auth: x-dev-sub header'ı ile kullanıcı taklidi (backend AUTH_MODE=dev).
// Cognito'ya geçince buraya Authorization: Bearer <jwt> eklenecek.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

function devSub(): string | null {
  try { return localStorage.getItem("ty_dev_sub"); } catch { return null; }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const sub = devSub();
  if (sub) headers["x-dev-sub"] = sub;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => req<T>("GET", p),
  post: <T>(p: string, b?: unknown) => req<T>("POST", p, b),
  put: <T>(p: string, b?: unknown) => req<T>("PUT", p, b),
};
