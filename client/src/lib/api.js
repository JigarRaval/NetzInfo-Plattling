/**
 * api.js - the only module that talks to the backend.
 *
 * Every path is relative, so the same build works on localhost, behind the
 * Vite proxy, from a phone on the local network and through a tunnel.
 *
 * The session token from the PIN login is kept here and attached to every
 * request automatically, so no screen has to think about it.
 */

/**
 * Where the API lives.
 *
 * Empty by default, which means "same origin" - that is the case when the
 * Express server serves the built app, and also on Netlify when /api/* is
 * proxied to the backend (see netlify.toml). Only set VITE_API_BASE if the
 * frontend has to call a backend on a different domain directly; then that
 * domain must also allow this origin through ALLOWED_ORIGINS.
 */
const BASE = import.meta.env.VITE_API_BASE || "";

const TOKEN_KEY = "stadtwerke-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();

  // An error page from Express is HTML, not JSON. Parsing it blindly throws
  // "Unexpected token" and hides the real status code, so parse defensively
  // and keep the raw text for the message instead.
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: `HTTP ${res.status}`, raw: raw.slice(0, 160) };
    }
  }

  if (!res.ok) {
    const error = new Error(data?.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    // An expired or missing session must send the user back to the PIN screen.
    if (res.status === 401 && data?.error === "login_required") setToken("");
    throw error;
  }
  return data;
}

export const api = {
  // --- session ---
  authState: () => request("/api/auth/state"),
  login: (pin, workerId) =>
    request("/api/auth/login", { method: "POST", body: { pin, workerId } }),
  verify: () => request("/api/auth/verify", { method: "POST" }),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  // --- data ---
  catalog: () => request("/api/catalog"),
  // Street and town behind a GPS position; answers { place: null } when offline.
  reverseGeocode: (lat, lng) =>
    request(`/api/geocode/reverse?lat=${lat}&lng=${lng}`),

  // Master data that the team can extend while working
  addDistrict: (payload) =>
    request("/api/catalog/districts", { method: "POST", body: payload }),
  removeDistrict: (id) =>
    request(`/api/catalog/districts/${id}`, { method: "DELETE" }),
  addService: (payload) =>
    request("/api/catalog/services", { method: "POST", body: payload }),
  removeService: (id) =>
    request(`/api/catalog/services/${id}`, { method: "DELETE" }),
  addPreset: (payload) =>
    request("/api/catalog/presets", { method: "POST", body: payload }),
  removePreset: (id) =>
    request(`/api/catalog/presets/${id}`, { method: "DELETE" }),
  incidents: () => request("/api/incidents"),
  capture: (payload) =>
    request("/api/incidents", { method: "POST", body: payload }),
  close: (id) => request(`/api/incidents/${id}/close`, { method: "POST" }),
  deleteIncident: (id) => request(`/api/incidents/${id}`, { method: "DELETE" }),

  drafts: () => request("/api/drafts"),
  createDraft: (incidentId, kind) =>
    request("/api/drafts", { method: "POST", body: { incidentId, kind } }),
  editDraft: (id, text) =>
    request(`/api/drafts/${id}`, { method: "PUT", body: { text } }),
  deleteDraft: (id) => request(`/api/drafts/${id}`, { method: "DELETE" }),
  /**
   * Write the text again.
   * shuffle: true asks for different wording; tone changes how it sounds.
   */
  regenerate: (id, { tone, shuffle } = {}) =>
    request(`/api/drafts/${id}/regenerate`, {
      method: "POST",
      body: { tone, shuffle },
    }),
  /**
   * Send the message to every channel.
   *
   * The endpoint was renamed from "approve" to "publish". If the server
   * answers 404 the older name is tried, so the app keeps working against a
   * backend that has not been updated or restarted yet.
   */
  publish: async (id) => {
    try {
      return await request(`/api/drafts/${id}/publish`, { method: "POST" });
    } catch (error) {
      if (error.status !== 404) throw error;
      return request(`/api/drafts/${id}/approve`, { method: "POST" });
    }
  },

  // --- push notifications ---
  pushKey: () => request("/api/push/key"),
  pushSubscribe: (subscription) =>
    request("/api/push/subscribe", { method: "POST", body: subscription }),
};

/* ---------------------------------------------------------------- push ----
 * Turning on notifications means three steps: ask the user, subscribe with
 * the service worker, hand the subscription to the server. Any step may fail
 * (unsupported browser, denied permission) and that is not an error state -
 * the application simply continues without push.
 */
export async function enablePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const { publicKey, available } = await api.pushKey();
  if (!available || !publicKey) return { ok: false, reason: "unavailable" };

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await api.pushSubscribe(subscription.toJSON());
  return { ok: true };
}

/** The VAPID key arrives as base64url text and must become bytes. */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
