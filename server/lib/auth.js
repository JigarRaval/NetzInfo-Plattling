/**
 * auth.js - who is allowed to send a message, and who it was.
 */

import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { config } from "../config.js";

export const sessions = new Map();
const attempts = new Map();
const ipAttempts = new Map();

let cachedWorkers = null;
let workersLastRefresh = 0;
const WORKERS_CACHE_TTL = 5 * 60 * 1000;

const MAX_AGE = () => config.auth.sessionHours * 60 * 60 * 1000;

/** Load workers from MongoDB or use config as fallback */
async function loadWorkersFromMongo() {
  try {
    const { User } = await import("./mongodb.js");
    // Removed .lean() so the AES plugin can decrypt fields properly
    const users = await User.find({ isActive: true });
    return users.map((u) => ({
      id: u.workerId,
      name: u.name,
      pin: u.pin,
      role: u.role || "worker",
    }));
  } catch (error) {
    console.error("Failed to load workers from MongoDB:", error.message);
    return null;
  }
}

/** Get workers - from MongoDB if available, otherwise from config */
async function getWorkers() {
  if (config.mongoUri) {
    const now = Date.now();
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
  return config.auth.workers;
}

export async function findWorker(id) {
  const workers = await getWorkers();
  const worker = workers.find((w) => w.id === id);
  return worker ? { id: worker.id, name: worker.name } : null;
}

export async function workerList() {
  const workers = await getWorkers();
  return workers.map((w) => ({ id: w.id, name: w.name }));
}

/** Clear the workers cache so the next login fetches fresh PINs from MongoDB */
export function invalidateWorkersCache() {
  cachedWorkers = null;
  workersLastRefresh = 0;
}

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
 * Securely verify a PIN.
 * If the stored PIN is plain text (legacy), it will allow the login
 * and automatically hash it in the database for future use.
 */
async function verifyPin(enteredPin, storedPin, workerId) {
  if (!storedPin) return false;

  // Check if the stored PIN is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isHashed = /^\$2[aby]\$/.test(storedPin);

  if (isHashed) {
    return await bcrypt.compare(enteredPin, storedPin);
  }

  // Fallback for plain-text PINs (config workers or un-migrated DB)
  if (enteredPin === storedPin) {
    // If this came from the DB, hash it now
    if (config.mongoUri) {
      try {
        const { User } = await import("./mongodb.js");
        const dbUser = await User.findOne({ workerId });
        if (dbUser) {
          dbUser.pin = enteredPin; // Pre-save hook will hash this
          await dbUser.save();
          invalidateWorkersCache(); // Reload cache
          console.log(`[auth] Auto-migrated plain-text PIN for ${workerId}`);
        }
      } catch (err) {
        console.error(
          `[auth] Auto-migration failed for ${workerId}:`,
          err.message
        );
      }
    }
    return true;
  }

  return false;
}

export async function login(workerId, pin, ip = null) {
  if (!config.auth.enabled) {
    const worker = (await findWorker(workerId)) || {
      id: "anonymous",
      name: config.auth.teamName,
    };
    return { ok: true, token: "disabled", worker, team: config.auth.teamName };
  }

  if (pin && pin.length < config.auth.minPinLength) {
    return { ok: false, reason: "pin_too_short" };
  }

  const waitSeconds = lockedFor(workerId);
  if (waitSeconds > 0)
    return { ok: false, reason: "locked", retryAfter: waitSeconds };

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

  let isMatch = false;

  if (account) {
    isMatch = await verifyPin(pin || "", account.pin, account.id);
  } else {
    // Dummy comparison to prevent timing attacks when user doesn't exist
    await bcrypt.compare(pin || "", "$2b$12$dummyhashdummyhashdummyha");
  }

  if (!account || !isMatch) {
    // Record failure
    const record = attempts.get(workerId) || { failures: 0 };
    record.failures += 1;
    if (record.failures >= config.auth.maxAttempts) {
      record.lockedUntil = Date.now() + config.auth.lockMinutes * 60 * 1000;
      record.failures = 0;
    }
    attempts.set(workerId, record);

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

export function workerOf(token) {
  if (!config.auth.enabled)
    return { id: "anonymous", name: config.auth.teamName };
  const session = sessions.get(token);
  return session ? session.worker : null;
}

export function logout(token) {
  sessions.delete(token);
}

const PUBLIC_GET = new Set([
  "/health",
  "/auth/state",
  "/catalog",
  "/public/status",
  "/push/key",
]);

export function requireSession(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  req.worker = isValid(token) ? workerOf(token) : null;

  if (req.path === "/auth/login") return next();
  if (req.method === "GET" && PUBLIC_GET.has(req.path)) return next();

  if (!isValid(token)) return res.status(401).json({ error: "login_required" });
  next();
}
