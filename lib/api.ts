import { safeJsonParse } from './rsc-security';

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
  try {
    const opts: RequestInit = {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...authHeaders(jwt),
      },
    };
    const res = await fetch(`${API_BASE}${path}`, opts);
    
    if (res.status === 401) {
      const error = new Error("unauthorized") as Error & { status: number };
      error.status = 401;
      throw error;
    }
    
    if (res.status === 402) {
      const error = new Error("PAYMENT_REQUIRED") as Error & { status: number };
      error.status = 402;
      throw error;
    }
    
    if (!res.ok) {
      let errorMessage = `Request failed: ${res.status}`;
      try {
        const text = await res.text();
        if (text) {
          try {
            // Use safe JSON parsing to prevent DoS attacks
            const json = safeJsonParse(text, 64 * 1024); // 64KB max for error responses
            errorMessage = json.detail || json.message || text;
          } catch {
            // If parsing fails, use text as-is (may be plain text error)
            errorMessage = text.substring(0, 500); // Limit error message length
          }
        }
      } catch {
        // If we can't read the response, use the default message
      }
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = res.status;
      throw error;
    }
    
    return res.json();
  } catch (err: any) {
    // Re-throw if it's already an Error with status
    if (err?.status) {
      throw err;
    }
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    // Re-throw other errors
    throw err;
  }
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

export async function getPrimaryAccount(jwt?: string) {
  return fetchJSON("/accounts/primary", jwt, { method: "GET" });
}

export async function getDashboardOpenTrades(accountId: number, jwt?: string) {
  return fetchJSON(`/dashboard/open-trades?account_id=${accountId}`, jwt, { method: "GET" });
}

export async function getDashboardTrades(accountId: number, fromDt?: string, toDt?: string, jwt?: string) {
  const params = new URLSearchParams({ account_id: String(accountId) });
  if (fromDt) params.set("from_dt", fromDt);
  if (toDt) params.set("to_dt", toDt);
  return fetchJSON(`/dashboard/trades?${params.toString()}`, jwt, { method: "GET" });
}

export async function getDashboardEquitySeries(accountId: number, window: string = "30d", jwt?: string) {
  return fetchJSON(`/dashboard/equity-series?account_id=${accountId}&window=${window}`, jwt, { method: "GET" });
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
  const loginUrl = `${API_BASE}/auth/login`;
  
  try {
    const r = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });  
    
    if (r.status === 401) {
      const error = new Error("Invalid email or password") as Error & { status: number };
      error.status = 401;
      throw error;
    }
    
    if (r.status === 402) {
      const error = new Error("PAYMENT_REQUIRED") as Error & { status: number };
      error.status = 402;
      throw error;
    }
    
    if (r.status === 404) {
      const error = new Error(`Login endpoint not found. Please check that the API server is running at ${API_BASE}`) as Error & { status: number };
      error.status = 404;
      throw error;
    }
    
    if (!r.ok) {
      let errorMessage = `Login failed: ${r.status}`;
      try {
        const text = await r.text();
        if (text) {
          // Try to parse as JSON first using safe parsing
          try {
            const json = safeJsonParse(text, 64 * 1024); // 64KB max for error responses
            errorMessage = json.detail || json.message || text;
          } catch {
            // If parsing fails, use text as-is (may be plain text error)
            errorMessage = text.substring(0, 500); // Limit error message length
          }
        }
      } catch {
        // If we can't read the response, use the default message
      }
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = r.status;
      throw error;
    }
    
    const data = await r.json();
    
    // Validate response structure
    if (!data.access_token) {
      throw new Error("Invalid response from server: missing access token");
    }
    
    return data;
  } catch (err: any) {
    // Re-throw if it's already an Error with status
    if (err?.status) {
      throw err;
    }
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(`Network error connecting to ${API_BASE}. Please check your connection and that the API server is running.`);
    }
    // Re-throw other errors
    throw err;
  }
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

export type UserSettings = {
  trade_allocation: number;
};

export async function getUserSettings(jwt?: string): Promise<UserSettings> {
  return fetchJSON("/user/settings", jwt, { method: "GET" });
}

export async function updateUserSettings(
  payload: { trade_allocation?: number },
  jwt?: string
): Promise<UserSettings> {
  return fetchJSON("/user/settings", jwt, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Video/Education API functions
export type Video = {
  id: string;
  title: string;
  youtube_url: string;
  description?: string;
  created_at: string;
  updated_at?: string;
};

export async function uploadVideo(
  payload: { title: string; youtube_url: string; description?: string },
  jwt?: string
): Promise<Video> {
  return fetchJSON("/v1/videos", jwt, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVideos(jwt?: string): Promise<Video[]> {
  return fetchJSON("/v1/videos", jwt, { method: "GET" });
}

export async function getVideoById(videoId: string, jwt?: string): Promise<Video> {
  return fetchJSON(`/v1/videos/${videoId}`, jwt, { method: "GET" });
}

export async function updateVideo(
  videoId: string,
  payload: { title?: string; youtube_url?: string; description?: string },
  jwt?: string
): Promise<Video> {
  return fetchJSON(`/v1/videos/${videoId}`, jwt, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteVideo(videoId: string, jwt?: string): Promise<void> {
  const token = jwt || (typeof window !== 'undefined' ? localStorage.getItem('autopip_jwt') : null);
  const res = await fetch(`${API_BASE}/v1/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to delete video");
  }
  // DELETE may return empty body, which is fine
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return;
  }
  // Try to parse JSON if there's content
  try {
    await res.json();
  } catch {
    // Empty response is fine
  }
}
