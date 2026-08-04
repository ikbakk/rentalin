const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface ErrorBody {
  error?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { getAuthHeaders, clearAuth } = await import("./auth");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
    ...options,
  });
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as ErrorBody));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as ErrorBody));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

export const publicApi = {
  get: <T>(path: string) => publicRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    publicRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};
