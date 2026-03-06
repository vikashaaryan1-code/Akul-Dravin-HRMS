const TOKEN_KEY = "hrms_token";

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const token = getStoredToken();
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!text) {
    throw new Error(`Empty response from server (status ${res.status})`);
  }

  let json: { ok: boolean; data?: T; error?: string };
  try {
    json = JSON.parse(text) as { ok: boolean; data?: T; error?: string };
  } catch {
    throw new Error(`Invalid JSON response (status ${res.status})`);
  }

  if (!json.ok) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
