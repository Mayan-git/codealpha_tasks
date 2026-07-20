const API_BASE = '/api';
const AUTH_KEY = 'ecommerce_auth';

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function setAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  return !!getAuth()?.token;
}

async function apiFetch(path, options = {}) {
  const auth = getAuth();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
    }
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
}

function formatPrice(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function requireLogin(redirectTo) {
  if (!isLoggedIn()) {
    const next = redirectTo || window.location.pathname + window.location.search;
    window.location.href = `login.html?next=${encodeURIComponent(next)}`;
    return false;
  }
  return true;
}
