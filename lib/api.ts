const DEFAULT_API = "https://officialtbot-api.onrender.com";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API).replace(/\/$/, "");
export const LANDING_BASE = (process.env.NEXT_PUBLIC_LANDING_URL || "").replace(/\/$/, "");

export function authHeaders(jwt?: string): Record<string, string> {
  const token = jwt || process.env.NEXT_PUBLIC_DEV_JWT || "";
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function fetchJSON(path: string, jwt?: string, init: RequestInit = {}) {
  const opts: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...authHeaders(jwt),
    },
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMe(jwt?: string) {
  return fetchJSON("/v1/me", jwt, { method: "GET" });
}

export async function getSubscription(jwt?: string) {
  return fetchJSON("/v1/subscription", jwt, { method: "GET" });
}

export async function getEntitlements(jwt?: string) {
  return fetchJSON("/v1/entitlements", jwt, { method: "GET" });
}

export async function getBrokerStatus(jwt?: string) {
  return fetchJSON("/v1/me/broker", jwt, { method: "GET" });
}

export async function saveBrokerCredentials(
  payload: { oandaAccountId: string; oandaApiKey: string },
  jwt?: string
) {
  return fetchJSON("/v1/me/broker", jwt, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getTrades(params: { cursor?: string; limit?: number } = {}, jwt?: string) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  const query = search.toString() ? `?${search.toString()}` : "";
  return fetchJSON(`/v1/trades${query}`, jwt, { method: "GET" });
}

export async function getTradeById(id: string, jwt?: string) {
  return fetchJSON(`/v1/trades/${id}`, jwt, { method: "GET" });
}

export async function getPerformanceSummary(jwt?: string) {
  return fetchJSON("/v1/performance/summary", jwt, { method: "GET" });
}

export async function getAccountSummary(jwt?: string) {
  return fetchJSON("/v1/account/summary", jwt, { method: "GET" });
}

export async function connectOanda(
  payload: { account_id: string; token?: string; label?: string },
  jwt?: string
) {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(jwt) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startCheckout(tier: "TIER1" | "TIER2") {
  // Map old tier format to new lookup key format
  const plan = tier === "TIER1" ? "tier1" : "tier2-monthly";
  const endpoint = `${API_BASE}/v1/checkout/start`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Checkout creation failed");
  }
  const data = await response.json();
  if (!data?.url) throw new Error("Checkout URL missing");
  window.location.href = data.url;
}

export async function createCheckout(tier: "TIER1" | "TIER2"): Promise<string> {
  const r = await fetch(`${API_BASE}/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  if (!r.ok) throw new Error(`Checkout failed: ${r.status}`);
  const data = await r.json();
  return data.url as string;
}

export type AuthResponse = {
  access_token: string;
  token_type: string;
  email: string;
  can_access_dashboard: boolean;
  entitlements: {
    canReceiveEmailSignals: boolean;
    canTrade: boolean;
    tier1: boolean;
    tier2Status?: string | null;
    tier2Active?: boolean;
    betaApplied?: boolean;
  };
};

export async function register(
  email: string,
  password: string,
  oandaAccountId?: string,
  oandaApiKey?: string
): Promise<AuthResponse> {
  const body: {
    email: string;
    password: string;
    oanda_account_id?: string;
    oanda_api_key?: string;
  } = { email, password };
  if (oandaAccountId) body.oanda_account_id = oandaAccountId;
  if (oandaApiKey) body.oanda_api_key = oandaApiKey;

  const r = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `Registration failed: ${r.status}`);
  }
  return r.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (r.status === 401) {
    throw new Error("Invalid email or password");
  }
  if (r.status === 402) {
    const error = new Error("PAYMENT_REQUIRED") as Error & { status: number };
    error.status = 402;
    throw error;
  }
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `Login failed: ${r.status}`);
  }
  return r.json();
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const r = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || "Failed to send reset email");
  }
  return r.json();
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const r = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || "Failed to reset password");
  }
  return r.json();
}
