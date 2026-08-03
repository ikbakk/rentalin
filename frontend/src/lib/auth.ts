const AUTH_KEY = "rentalin_auth";

export interface AuthState {
  token: string;
  name: string;
  email: string;
  role: string;
  businessId: string;
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getAuth();
  return auth ? { Authorization: `Bearer ${auth.token}` } : {};
}
