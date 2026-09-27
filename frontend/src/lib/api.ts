// API istemcisi. Base URL VITE_API_URL'den; boşsa lokal backend.
// Auth: Cognito ID token'ı Authorization: Bearer ile gider (API Gateway JWT authorizer).
import { getIdToken } from "@/lib/cognito";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const token = await getIdToken();
  if (token) headers["authorization"] = `Bearer ${token}`;
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

// Tiny in-memory GET cache so moving between app pages doesn't refetch every time.
const cache = new Map<string, { at: number; data: unknown }>();

export const api = {
  get: <T>(p: string) => req<T>("GET", p),
  post: <T>(p: string, b?: unknown) => req<T>("POST", p, b),
  put: <T>(p: string, b?: unknown) => req<T>("PUT", p, b),
  del: <T>(p: string) => req<T>("DELETE", p),
  // Cached GET: returns a fresh value within ttlMs, else fetches and stores.
  getCached: async <T>(p: string, ttlMs = 60_000): Promise<T> => {
    const hit = cache.get(p);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
    const data = await req<T>("GET", p);
    cache.set(p, { at: Date.now(), data });
    return data;
  },
  invalidate: (p?: string) => (p ? cache.delete(p) : cache.clear()),
};

// Connection actions. Each mutation clears the GET cache so lists refresh.
export const connections = {
  request: async (toId: string, message?: string) => {
    const r = await api.post("/connections", { toId, message });
    api.invalidate();
    return r;
  },
  accept: async (id: string) => { const r = await api.post(`/connections/${id}/accept`); api.invalidate(); return r; },
  reject: async (id: string) => { const r = await api.post(`/connections/${id}/reject`); api.invalidate(); return r; },
};

// Upload an image: get a presigned PUT URL, upload straight to S3, return the key.
export async function uploadImage(file: File, kind: "avatar" | "gallery"): Promise<string> {
  const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>("/uploads/presign", {
    kind,
    contentType: file.type,
  });
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!res.ok) throw new Error("Yükleme başarısız");
  return key;
}

export const messages = {
  list: <T>() => api.get<T>("/messages"),
  thread: <T>(connectionId: string) => api.get<T>(`/messages/${connectionId}`),
  send: async (connectionId: string, body: string) => {
    const r = await api.post(`/messages/${connectionId}`, { body });
    api.invalidate("/me/dashboard");
    return r;
  },
};
