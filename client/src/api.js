const API = import.meta.env.VITE_API || "";

export function setToken(token) {
  localStorage.setItem("picloud_token", token);
}

export function getToken() {
  return localStorage.getItem("picloud_token");
}

export function clearToken() {
  localStorage.removeItem("picloud_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API}${path}`, { ...options, headers });
}

export function apiBase() {
  return API;
}
