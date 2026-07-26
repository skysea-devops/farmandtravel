/**
 * Thin API client. Points at VITE_API_URL — the API Gateway HTTP API base.
 * That env var is unset until Sprint 1, so calls fail with a clear message
 * rather than a silent network error. Keeping all fetch logic behind this one
 * function means auth headers / error handling get wired in exactly one place.
 */
const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) {
    throw new ApiError(
      0,
      'API not configured yet. Set VITE_API_URL once the backend is up (Sprint 1).',
    )
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    throw new ApiError(res.status, `Request failed with ${res.status}`)
  }
  return (await res.json()) as T
}
