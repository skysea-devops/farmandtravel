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
    // Paywall: a 'membership_required' 403 means the user needs a subscription —
    // send them to the membership page (the billing/profile routes stay accessible).
    if (res.status === 403 && data?.error === "membership_required") {
      try {
        if (!location.pathname.endsWith("/abonelik")) location.assign("/app/abonelik");
      } catch { /* non-browser context */ }
    }
    throw new Error(msg);
  }
  return data as T;
}

// GET cache. Two layers:
//  - in-memory: instant within a session while the tab is open.
//  - localStorage: survives full page reloads, so re-opening an app page shows the
//    last data instantly (stale-while-revalidate) instead of waiting on a cold API.
// Entries are keyed by the current user's sub so accounts never see each other's data.
type Entry = { at: number; data: unknown };
const cache = new Map<string, Entry>();
let scope = "anon";

const LS = "ty:cache:";
const PERSIST_MAX = 24 * 60 * 60_000; // ignore persisted data older than a day

function lsGet(key: string): Entry | null {
  try {
    const v = localStorage.getItem(LS + key);
    return v ? (JSON.parse(v) as Entry) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, e: Entry) {
  try {
    localStorage.setItem(LS + key, JSON.stringify(e));
  } catch { /* quota / private mode */ }
}
function lsDel(key: string) {
  try {
    localStorage.removeItem(LS + key);
  } catch { /* ignore */ }
}
function lsClearAll() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(LS)) localStorage.removeItem(k);
  } catch { /* ignore */ }
}

// Called by the auth layer when the signed-in user changes (including to null).
// Only a real user switch / logout wipes persisted data; the initial anon→user
// restore on page load keeps it, so reloads stay instant.
export function setCacheScope(sub: string | null) {
  const next = sub ?? "anon";
  if (next === scope) return;
  const wasReal = scope !== "anon";
  cache.clear();
  if (wasReal) lsClearAll();
  scope = next;
}
const scoped = (p: string) => `${scope}::${p}`;

export const api = {
  get: <T>(p: string) => req<T>("GET", p),
  post: <T>(p: string, b?: unknown) => req<T>("POST", p, b),
  put: <T>(p: string, b?: unknown) => req<T>("PUT", p, b),
  del: <T>(p: string) => req<T>("DELETE", p),
  // Cached GET with stale-while-revalidate: fresh mem hit → return it; else return
  // persisted data instantly and refresh in the background; else fetch.
  getCached: async <T>(p: string, ttlMs = 60_000): Promise<T> => {
    const k = scoped(p);
    const hit = cache.get(k);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
    const store = (data: T) => { const e = { at: Date.now(), data }; cache.set(k, e); lsSet(k, e); return data; };
    const persisted = lsGet(k);
    if (persisted && Date.now() - persisted.at < PERSIST_MAX) {
      cache.set(k, persisted); // seed mem so quick re-navigation is instant
      void req<T>("GET", p).then(store).catch(() => {}); // refresh in background
      return persisted.data as T;
    }
    return store(await req<T>("GET", p));
  },
  invalidate: (p?: string) => {
    if (p) { cache.delete(scoped(p)); lsDel(scoped(p)); }
    else { cache.clear(); lsClearAll(); }
  },
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

// Downscale + re-encode to JPEG in the browser so we don't upload multi-MB phone
// photos (much faster upload + display). Falls back to the original on any failure.
async function shrink(file: File, maxDim: number, quality = 0.82): Promise<Blob> {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    URL.revokeObjectURL(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) throw new Error("encode failed");
    return blob;
  } catch {
    return file; // fall back to original
  }
}

// Upload an image: shrink it, get a presigned PUT URL, upload straight to S3, return the key.
export async function uploadImage(file: File, kind: "avatar" | "gallery"): Promise<string> {
  const blob = await shrink(file, kind === "avatar" ? 512 : 1600);
  const contentType = blob.type === "image/jpeg" || blob.type === "image/png" || blob.type === "image/webp"
    ? blob.type : "image/jpeg";
  const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>("/uploads/presign", {
    kind,
    contentType,
    size: blob.size,
  });
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": contentType }, body: blob });
  if (!res.ok) throw new Error("Yükleme başarısız");
  return key;
}

export const activities = {
  list: <T>(limit = 20, offset = 0) => api.getCached<T>(`/activities?limit=${limit}&offset=${offset}`, 60_000),
  eligibility: <T>() => api.get<T>("/activities/eligibility"),
  submit: async <T>(body: unknown) => { const r = await api.post<T>("/activities", body); api.invalidate(); return r; },
  mine: <T>() => api.get<T>("/activities/mine"),
  adminList: <T>(status = "pending") => api.get<T>(`/admin/activities?status=${status}`),
  approve: async (id: string) => { const r = await api.post(`/admin/activities/${id}/approve`); api.invalidate(); return r; },
  reject: async (id: string) => { const r = await api.post(`/admin/activities/${id}/reject`); api.invalidate(); return r; },
};

export const admin = {
  // Broadcast a message from the official account to all members.
  broadcast: (body: string) => api.post<{ recipients: number }>("/admin/broadcast", { body }),
  // Message a single member from the official account (warnings / rule reminders).
  message: (memberId: string, body: string) => api.post<{ connectionId: string }>("/admin/message", { memberId, body }),
  // Search members by name/email to pick a recipient.
  searchMembers: <T>(q: string) => api.get<T>(`/admin/members?q=${encodeURIComponent(q)}`),
  // Official "Toprakla Yeniden" account inbox (admin sees sent + replies).
  inbox: <T>() => api.get<T>("/admin/inbox"),
  inboxThread: <T>(connectionId: string) => api.get<T>(`/admin/inbox/${connectionId}`),
  inboxReply: (connectionId: string, body: string) => api.post(`/admin/inbox/${connectionId}`, { body }),
};

export const billing = {
  // Returns the hosted checkout URL to redirect to (or throws on 503 when unconfigured).
  checkout: (market: "tr" | "intl") => api.post<{ url: string }>("/billing/checkout", { market }),
};

export const saved = {
  list: <T>() => api.getCached<T>("/saved", 60_000),
  add: async (memberId: string) => { const r = await api.post("/saved", { memberId }); api.invalidate(); return r; },
  remove: async (memberId: string) => { const r = await api.del(`/saved/${memberId}`); api.invalidate(); return r; },
};

export const notifications = {
  list: <T>() => api.get<T>("/notifications"),
  unread: <T>() => api.getCached<T>("/notifications/unread", 30_000),
};

export const reviews = {
  list: <T>(memberId: string) => api.get<T>(`/members/${memberId}/reviews`),
  // My own reviews: received (about me) + written (by me).
  me: <T>() => api.getCached<T>("/reviews/me", 60_000),
  submit: async (revieweeId: string, rating: number, comment?: string) => {
    const r = await api.post("/reviews", { revieweeId, rating, comment });
    api.invalidate();
    return r;
  },
  // Admin moderation queue (reviews held for approval).
  adminList: <T>() => api.get<T>("/admin/reviews"),
  approve: async (id: string, note?: string) => { const r = await api.post(`/admin/reviews/${id}/approve`, { note }); api.invalidate(); return r; },
  reject: async (id: string, note?: string) => { const r = await api.post(`/admin/reviews/${id}/reject`, { note }); api.invalidate(); return r; },
};

export const messages = {
  list: <T>() => api.getCached<T>("/messages", 30_000),
  thread: <T>(connectionId: string, params?: { before?: string; after?: string }) => {
    const qs = params?.before ? `?before=${encodeURIComponent(params.before)}`
      : params?.after ? `?after=${encodeURIComponent(params.after)}`
      : "";
    return api.get<T>(`/messages/${connectionId}${qs}`);
  },
  send: async <T>(connectionId: string, body: string) => {
    const r = await api.post<T>(`/messages/${connectionId}`, { body });
    api.invalidate("/me/dashboard");
    return r;
  },
};
