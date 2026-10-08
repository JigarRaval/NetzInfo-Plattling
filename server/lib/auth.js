/**
 * auth.js - who is allowed to send a message, and who it was.
 *
 * Every worker has a personal PIN. An earlier version used one shared team
 * PIN plus a name chosen from a dropdown, which meant anybody could publish
 * under a colleague's name - a record that looks trustworthy but proves
 * nothing is worse than no record at all.
 *
 * Reading stays open: the feed, the widget and the public status need no
 * login. Only sending requires a session.
 */

import crypto from "node:crypto";
import { config } from "../config.js";

// token -> { issuedAt, worker }. In memory on purpose: restarting the server
// ends every session, which is what you want for a shared device.
const sessions = new Map();

// workerId -> { failures, lockedUntil }. A four digit PIN is only 10,000
// guesses, so repeated failures have to cost time.
const attempts = new Map();

const MAX_AGE = () => config.auth.sessionHours * 60 * 60 * 1000;

/** Compare two secrets without leaking their length through timing. */
function sameSecret(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** The person behind an id - never exposed with the PIN attached. */
export function findWorker(id) {
  const worker = config.auth.workers.find((w) => w.id === id);
  return worker ? { id: worker.id, name: worker.name } : null;
}

/** The list for the login screen: names only, no secrets. */
export function workerList() {
  return config.auth.workers.map((w) => ({ id: w.id, name: w.name }));
}

/** How long this worker still has to wait, in seconds (0 = not locked). */
function lockedFor(workerId) {
  const record = attempts.get(workerId);
  if (!record?.lockedUntil) return 0;
  const left = record.lockedUntil - Date.now();
  if (left <= 0) {
    attempts.delete(workerId);
    return 0;
  }
  return Math.ceil(left / 1000);
}

/**
 * Sign in as a specific person with that person's own PIN.
 * @returns {{ok:true, token, worker, team}} or {{ok:false, reason, retryAfter}}
 */
export function login(workerId, pin) {
  if (!config.auth.enabled) {
    const worker = findWorker(workerId) || {
      id: "anonymous",
      name: config.auth.teamName,
    };
    return { ok: true, token: "disabled", worker, team: config.auth.teamName };
  }

  const waitSeconds = lockedFor(workerId);
  if (waitSeconds > 0)
    return { ok: false, reason: "locked", retryAfter: waitSeconds };

  const account = config.auth.workers.find((w) => w.id === workerId);
  // Always do the comparison, even for an unknown id, so a wrong name and a
  // wrong PIN take the same amount of time.
  const matches = sameSecret(
    pin || "",
    account ? account.pin : "\u0000no-such-account"
  );

  if (!account || !matches) {
    const record = attempts.get(workerId) || { failures: 0 };
    record.failures += 1;
    if (record.failures >= config.auth.maxAttempts) {
      record.lockedUntil = Date.now() + config.auth.lockMinutes * 60 * 1000;
      record.failures = 0;
    }
    attempts.set(workerId, record);
    return { ok: false, reason: "wrong_pin" };
  }

  attempts.delete(workerId);
  const token = crypto.randomBytes(24).toString("hex");
  const worker = { id: account.id, name: account.name };
  sessions.set(token, { issuedAt: Date.now(), worker });
  return { ok: true, token, worker, team: config.auth.teamName };
}

export function isValid(token) {
  if (!config.auth.enabled) return true;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.issuedAt > MAX_AGE()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

/** The person belonging to a token, if the session is still valid. */
export function workerOf(token) {
  if (!config.auth.enabled)
    return { id: "anonymous", name: config.auth.teamName };
  const session = sessions.get(token);
  return session ? session.worker : null;
}

export function logout(token) {
  sessions.delete(token);
}

/**
 * Endpoints the whole world may call without a session.
 *
 * This is an allow-list, not a rule about HTTP verbs. Treating every GET as
 * public was a mistake: /api/incidents also returns dictated notes, the GPS
 * position and the name of the person who reported it. Those are internal.
 * What is genuinely public is only the published notice and the master data
 * the login screen needs.
 */
const PUBLIC_GET = new Set([
  "/health", // monitoring
  "/auth/state", // the login screen needs the list of names
  "/catalog", // utilities, districts, presets - no personal data
  "/public/status", // the published notices, exactly as citizens see them
  "/push/key", // the public half of the push key pair
]);

/**
 * Express middleware. Everything that is not explicitly public needs a
 * session, and the handler learns who is acting.
 */
export function requireSession(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  req.worker = isValid(token) ? workerOf(token) : null;

  if (req.path === "/auth/login") return next();
  if (req.method === "GET" && PUBLIC_GET.has(req.path)) return next();

  if (!isValid(token)) return res.status(401).json({ error: "login_required" });
  next();
}
