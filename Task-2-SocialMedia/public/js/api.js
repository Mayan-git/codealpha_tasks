const TOKEN_KEY = "msm_token";
const USER_KEY = "msm_user";

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn() {
    return !!Auth.getToken();
  },
  requireLogin() {
    if (!Auth.isLoggedIn()) {
      window.location.href = "login.html";
    }
  },
};

async function api(path, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401 && token) {
      Auth.clearSession();
    }
    throw new Error(message);
  }

  return data;
}

function timeAgo(isoString) {
  const iso = isoString.replace(" ", "T") + "Z";
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${name[0]}`;
  }
  return "now";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initials(username) {
  return (username || "?").slice(0, 2).toUpperCase();
}

function avatarHtml(username, avatarUrl, sizeClass = "") {
  const cls = `avatar ${sizeClass}`.trim();
  if (avatarUrl) {
    return `<img class="${cls}" src="${avatarUrl}" alt="${escapeHtml(username)}">`;
  }
  return `<div class="${cls} avatar-fallback">${initials(username)}</div>`;
}
