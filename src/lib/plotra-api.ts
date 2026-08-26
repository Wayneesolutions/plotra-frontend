// API client for public/auth endpoints — matches the existing plotra-backend routes.
// Dashboard calls still go through src/api/apiClient.js (axios + localStorage JWT).
const API_BASE =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // no-op — network-level failure
  }

  if (!res.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Something went wrong. Please try again.";
    throw new ApiError(message, res.status);
  }

  return body as T;
}

export type DealerUser = {
  id: string;
  businessName: string;
  name: string;
  email: string;
  plan: string;
  role: string;
};

export function login(email: string, password: string) {
  return request<{ token: string; user: DealerUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function submitAccessRequest(input: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message?: string;
}) {
  return request<{ message: string }>("/api/v1/public/request-access", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Use the same localStorage keys as the existing dashboard (PrivateRoute checks pve_token).
export function saveSession(token: string, user: DealerUser) {
  localStorage.setItem("pve_token", token);
  localStorage.setItem("pve_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("pve_token");
  localStorage.removeItem("pve_user");
}
