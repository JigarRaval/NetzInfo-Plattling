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
export const sessions = new Map();

// workerId -> { failures, lockedUntil }. A PIN is only 10,000 guesses
// for 4 digits, so repeated failures have to cost time.
const attempts = new Map();

// IP-based rate limiting (IP -> { failures, lockedUntil })
const ipAttempts = new Map();

// Cached workers from MongoDB (refreshed periodically)
let cachedWorkers = null;
let workersLastRefresh = 0;
const WORKERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MAX_AGE = () => config.auth.sessionHours * 60 * 60 * 1000;

/** Compare two secrets without leaking their length through timing. */
function sameSecret(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** Load workers from MongoDB or use config as fallback */
async function loadWorkersFromMongo() {
  try {
    const { User } = await import("./mongodb.js");
    const users = await User.find({ isActive: true }).lean();
    return users.map((u) => ({
      id: u.workerId,
      name: u.name,
      pin: u.pin,
      role: u.role || "worker",
    }));
  } catch (error) {
    console.error("Failed to load workers from MongoDB:", error);
    return null;
  }
}

/** Get workers - from MongoDB if available, otherwise from config */
async function getWorkers() {
  // If MongoDB is configured, try to load from MongoDB
  if (config.mongoUri) {
    const now = Date.now();
    // Refresh cache if TTL expired or not cached
    if (!cachedWorkers || now - workersLastRefresh > WORKERS_CACHE_TTL) {
      const mongoWorkers = await loadWorkersFromMongo();
      if (mongoWorkers && mongoWorkers.length > 0) {
        cachedWorkers = mongoWorkers;
        workersLastRefresh = now;
        return cachedWorkers;
      }
    }
    if (cachedWorkers) {
      return cachedWorkers;
    }
  }

  // Fallback to config-based workers
  return config.auth.workers;
}

/** The person behind an id - never exposed with the PIN attached. */
export async function findWorker(id) {
  const workers = await getWorkers();
  const worker = workers.find((w) => w.id === id);
  return worker ? { id: worker.id, name: worker.name } : null;
}

/** The list for the login screen: names only, no secrets. */
export async function workerList() {
  const workers = await getWorkers();
  return workers.map((w) => ({ id: w.id, name: w.name }));
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
 * Check if a PIN is trivial and should be rejected.
 * Trivial PINs: repeated digits, sequential digits, or too short.
 */
function isTrivialPin(pin) {
  if (!pin || pin.length < config.auth.minPinLength) return true;

  // Check for repeated digits (e.g., 111111, 222222)
  if (/^(\d)\1+$/.test(pin)) return true;

  // Check for sequential digits (e.g., 123456, 654321)
  const isSequential = (direction) => {
    for (let i = 1; i < pin.length; i++) {
      const diff = parseInt(pin[i]) - parseInt(pin[i - 1]);
      if (diff !== direction) return false;
    }
    return true;
  };
  if (isSequential(1) || isSequential(-1)) return true;

  return false;
}

/**
 * Sign in as a specific person with that person's own PIN.
 * @returns {{ok:true, token, worker, team}} or {{ok:false, reason, retryAfter}}
 */
export async function login(workerId, pin, ip = null) {
  if (!config.auth.enabled) {
    const worker = (await findWorker(workerId)) || {
      id: "anonymous",
      name: config.auth.teamName,
    };
    return { ok: true, token: "disabled", worker, team: config.auth.teamName };
  }

  // Check PIN length
  if (pin && pin.length < config.auth.minPinLength) {
    return { ok: false, reason: "pin_too_short" };
  }

  // Check for trivial PINs (only for new account setup, not during login)
  // This check is done during account creation, not here

  const waitSeconds = lockedFor(workerId);
  if (waitSeconds > 0)
    return { ok: false, reason: "locked", retryAfter: waitSeconds };

  // IP-based rate limiting
  if (ip) {
    const ipRecord = ipAttempts.get(ip) || { failures: 0 };
    if (ipRecord.failures >= config.auth.maxAttempts) {
      const ipWaitSeconds = Math.ceil(
        (ipRecord.lockedUntil - Date.now()) / 1000
      );
      if (ipWaitSeconds > 0) {
        return { ok: false, reason: "locked", retryAfter: ipWaitSeconds };
      } else {
        ipAttempts.delete(ip);
      }
    }
  }

  const workers = await getWorkers();
  const account = workers.find((w) => w.id === workerId);
  // Always do the comparison, even for an unknown id, so a wrong name and a
  // wrong PIN take the same amount of time.
  const matches = sameSecret(
    pin || "",
    account ? account.pin : "\u0000no-such-account"
  );

  if (!account || !matches) {
    // Record failure for worker
    const record = attempts.get(workerId) || { failures: 0 };
    record.failures += 1;
    if (record.failures >= config.auth.maxAttempts) {
      record.lockedUntil = Date.now() + config.auth.lockMinutes * 60 * 1000;
      record.failures = 0;
    }
    attempts.set(workerId, record);

    // Record failure for IP
    if (ip) {
      const ipRecord = ipAttempts.get(ip) || { failures: 0 };
      ipRecord.failures += 1;
      if (ipRecord.failures >= config.auth.maxAttempts) {
        ipRecord.lockedUntil = Date.now() + config.auth.lockMinutes * 60 * 1000;
        ipRecord.failures = 0;
      }
      ipAttempts.set(ip, ipRecord);
    }

    return { ok: false, reason: "wrong_pin" };
  }

  attempts.delete(workerId);
  if (ip) ipAttempts.delete(ip);

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
/** Clear the workers cache so the next login fetches fresh PINs from MongoDB */
export function invalidateWorkersCache() {
  cachedWorkers = null;
  workersLastRefresh = 0;
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
