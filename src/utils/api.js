export class ApiError extends Error {
  constructor(message, status, code, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request(method, url, body, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      keepalive: options.keepalive
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that it is running and try again.", 0, "NETWORK");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A 401 on a data call means the session ended; the app listens for this and shows the login page.
    if (response.status === 401 && !url.startsWith("/api/auth/")) {
      window.dispatchEvent(new Event("prepmate:unauthorized"));
    }
    throw new ApiError(data?.error || `Request failed (${response.status}).`, response.status, data?.code, data?.fields);
  }
  return data;
}

export const api = {
  me: () => request("GET", "/api/auth/me"),
  signup: (payload) => request("POST", "/api/auth/signup", payload),
  login: (payload) => request("POST", "/api/auth/login", payload),
  logout: () => request("POST", "/api/auth/logout"),

  loadData: () => request("GET", "/api/data"),
  createApplication: (application) => request("POST", "/api/applications", application),
  updateApplication: (id, application) => request("PUT", `/api/applications/${id}`, application),
  deleteApplication: (id) => request("DELETE", `/api/applications/${id}`),
  saveProgress: (progress, options) => request("PUT", "/api/progress", progress, options)
};
