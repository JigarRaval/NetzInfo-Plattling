/**
 * api.js - all HTTP endpoints of the application.
 *
 * Kept in one file on purpose: the complete contract between browser and
 * server fits on one screen, which makes it easy to explain and to audit.
 * The handlers stay thin - the thinking lives in core/ and channels/.
 */

import express from "express";
import crypto from "node:crypto";
import {
  all,
  insert,
  findById,
  update,
  replace,
  addPushSubscription,
} from "../lib/store.js";
import {
  sessions,
  login,
  logout,
  requireSession,
  workerList,
  invalidateWorkersCache,
} from "../lib/auth.js";
import {
  SERVICES,
  getService,
  allServices,
  getDistricts,
  allDistricts,
  allPresets,
  slugify,
} from "../data/catalog.js";
import {
  buildIncident,
  findDuplicate,
  recalculate,
} from "../core/incidents.js";
import { composeAll, textToHtml } from "../core/compose.js";
import { runChecks } from "../core/quality.js";
import {
  channelList,
  publishEverywhere,
  buildRss,
} from "../channels/registry.js";
import { makeId, nowIso, localTime } from "../lib/time.js";
import { reverseGeocode } from "../lib/geocode.js";
import { config } from "../config.js";
import * as push from "../lib/push.js";

export const api = express.Router();

// Initialize store before server starts
import { initializeStore } from "../lib/store.js";
import { User } from "../lib/mongodb.js";
initializeStore();

/**
 * GET /api/geocode/reverse?lat=&lng= - the street behind a GPS position.
 * Answers 200 with null when the lookup is unavailable; a missing street is
 * never treated as an error.
 * This endpoint is public (no auth required) as it's only a lookup service.
 */
api.get("/geocode/reverse", async (req, res) => {
  const place = await reverseGeocode(
    Number(req.query.lat),
    Number(req.query.lng)
  );
  res.json({ place });
});

/* -------------------------------------------------------------------- login
 * Reading stays open (the widget and the feed need that). Everything that
 * changes or sends something requires a session - see lib/auth.js.
 */

// Login and auth endpoints are public
api.post("/auth/login", async (req, res) => {
  const result = await login(req.body?.workerId, req.body?.pin, req.ip);

  if (!result.ok) {
    if (result.reason === "locked") {
      return res
        .status(429)
        .json({ error: "too_many_attempts", retryAfter: result.retryAfter });
    }
    if (result.reason === "pin_too_short") {
      return res.status(400).json({ error: "pin_too_short" });
    }
    return res.status(401).json({ error: "wrong_pin" });
  }
  res.json({ token: result.token, team: result.team, worker: result.worker });
});

api.post("/auth/logout", requireSession, async (req, res) => {
  const header = req.get("Authorization") || "";
  logout(header.startsWith("Bearer ") ? header.slice(7) : "");
  res.json({ ok: true });
});

/**
 * Is the token in this browser still good?
 *
 * The route is protected, so it answers 200 for a valid session and 401 for
 * an expired one. That lets the app decide on start-up whether to show the
 * PIN screen, instead of trusting whatever is left in localStorage.
 */
api.post("/auth/verify", requireSession, (req, res) => res.json({ ok: true }));

/** Does this installation require a login, and who can be on shift? */
api.get("/auth/state", requireSession, async (req, res) => {
  const worker = req.worker
    ? { id: req.worker.id, name: req.worker.name }
    : null;
  res.json({
    required: config.auth.enabled,
    team: config.auth.teamName,
    workers: await workerList(), // names only, never the PINs
    worker: worker,
  });
});

/* ------------------------------------------------------------ push notices */
api.get("/push/key", requireSession, async (req, res) => {
  res.json({ publicKey: push.publicKey(), available: push.available() });
});

api.post("/push/subscribe", requireSession, async (req, res) => {
  if (!req.body?.endpoint)
    return res.status(400).json({ error: "subscription_required" });
  const count = addPushSubscription(req.body);
  res.json({ ok: true, subscribers: count });
});

/* ------------------------------------------------------------------ health */
api.get("/health", requireSession, async (req, res) => {
  const db = await all();
  res.json({
    ok: true,
    app: "stadtwerke",
    version: "2.0.0",
    time: nowIso(),
    counts: {
      incidents: db.incidents.length,
      drafts: db.drafts.length,
      publications: db.publications.length,
    },
  });
});

/* ----------------------------------------------------------------- catalog */
/** Master data the interface needs to render the report form. */
api.get("/catalog", requireSession, async (req, res) => {
  res.json({
    services: await allServices(),
    districts: await allDistricts(),
    presets: await allPresets(),
    channels: channelList(),
  });
});

/* ------------------------------------------------ editing the master data
 * A new village, a new kind of fault: both can be added while reporting,
 * without a code change. Only entries that were added this way can be
 * removed again - the built-in ones stay.
 */
api.post("/catalog/districts", requireSession, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name_required" });

  const district = {
    id: `c_${slugify(name)}`,
    name,
    households: Math.max(0, Number(req.body?.households) || 0),
    custom: true,
  };
  if (allDistricts().some((d) => d.id === district.id))
    return res.status(409).json({ error: "already_exists" });

  await insert("customDistricts", district);
  res.status(201).json(district);
});

api.delete("/catalog/districts/:id", async (req, res) => {
  const rows = (await all()).customDistricts || [];
  const next = rows.filter((d) => d.id !== req.params.id);
  if (next.length === rows.length)
    return res.status(404).json({ error: "not_found" });
  replace("customDistricts", next);
  res.json({ ok: true });
});

/**
 * Add a category. Needed because a report does not always fit electricity,
 * water, wastewater or district heating - a gas smell or a broken street
 * light has to be reportable too, without a code change.
 */
api.post("/catalog/services", requireSession, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name_required" });

  const service = {
    id: `c_${slugify(name)}`,
    icon: String(req.body?.icon || "⚠️").slice(0, 4),
    custom: true,
    // One name for every language: an automatic translation of a local term
    // would be worse than leaving it as the team wrote it.
    name: { de: name, en: name, fr: name, es: name },
  };
  if (getService(service.id))
    return res.status(409).json({ error: "already_exists" });

  await insert("customServices", service);
  res.status(201).json(service);
});

api.delete("/catalog/services/:id", async (req, res) => {
  const rows = (await all()).customServices || [];
  const next = rows.filter((x) => x.id !== req.params.id);
  if (next.length === rows.length)
    return res.status(404).json({ error: "not_found" });

  // A category that problem types still point at cannot simply vanish.
  if (allPresets().some((p) => p.service === req.params.id)) {
    return res.status(409).json({ error: "still_in_use" });
  }
  replace("customServices", next);
  res.json({ ok: true });
});

api.post("/catalog/presets", requireSession, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name_required" });

  const service = getService(req.body?.service) ? req.body.service : "strom";
  const tone = ["reassuring", "steady", "careful", "light"].includes(
    req.body?.tone
  )
    ? req.body.tone
    : "steady";
  const cause = String(req.body?.cause || name).trim();

  // A user types one name; it is used for every language, because we cannot
  // translate it automatically and a wrong translation is worse than none.
  const preset = {
    id: `c_${slugify(name)}`,
    service,
    tone,
    custom: true,
    icon: req.body?.icon || "document",
    etaMinutes: Math.max(15, Number(req.body?.etaMinutes) || 120),
    planned: Boolean(req.body?.planned),
    boilNotice: Boolean(req.body?.boilNotice),
    name: { de: name, en: name, fr: name, es: name },
    cause: { de: cause, en: cause, fr: cause, es: cause },
  };
  if (allPresets().some((p) => p.id === preset.id))
    return res.status(409).json({ error: "already_exists" });

  await insert("customPresets", preset);
  res.status(201).json(preset);
});

api.delete("/catalog/presets/:id", async (req, res) => {
  const rows = (await all()).customPresets || [];
  const next = rows.filter((p) => p.id !== req.params.id);
  if (next.length === rows.length)
    return res.status(404).json({ error: "not_found" });
  replace("customPresets", next);
  res.json({ ok: true });
});

/* --------------------------------------------------------------- incidents */
api.get("/incidents", requireSession, async (req, res) => {
  const incidents = (await all()).incidents;
  res.json(
    incidents.sort((a, b) => {
      const aTime = a.capturedAt || a.startedAt || "";
      const bTime = b.capturedAt || b.startedAt || "";
      return bTime.localeCompare(aTime);
    })
  );
});

/**
 * Capture a report. A preset id and one district are enough.
 *
 * While work on an outage is still in progress, the same problem cannot be
 * reported again - not even deliberately. Two notices for one burst pipe
 * confuse citizens and split the history, so the only way forward is an
 * update on the existing incident. There is no override.
 */
api.post("/incidents", requireSession, async (req, res) => {
  const input = req.body || {};

  const duplicate = await findDuplicate(input);
  if (duplicate) {
    return res
      .status(409)
      .json({ error: "already_running", incident: duplicate });
  }

  // The report carries the name of whoever is signed in on this device.
  const created = await insert(
    "incidents",
    await buildIncident({ ...input, reportedBy: req.worker })
  );
  res.status(201).json(created);
});

/**
 * DELETE /api/incidents/:id - remove a report that should never have existed.
 *
 * Only possible while nothing has been published. Once citizens have seen a
 * notice it cannot be made to disappear; the honest way out is an all-clear,
 * which is why a published incident is refused here.
 */
api.delete("/incidents/:id", async (req, res) => {
  const incident = await findById("incidents", req.params.id);
  if (!incident) return res.status(404).json({ error: "not_found" });

  // publishedAt alone is not proof: the one-click all-clear publishes without
  // ever setting it. The honest test is whether a publication record exists.
  const everSent = (await all()).publications.some(
    (p) => p.incidentId === incident.id
  );
  if (everSent) return res.status(409).json({ error: "already_published" });

  replace(
    "drafts",
    (await all()).drafts.filter((d) => d.incidentId !== incident.id)
  );
  replace(
    "incidents",
    (await all()).incidents.filter((i) => i.id !== incident.id)
  );
  res.json({ ok: true });
});

api.patch("/incidents/:id", async (req, res) => {
  const incident = await findById("incidents", req.params.id);
  if (!incident) return res.status(404).json({ error: "not_found" });
  res.json(
    await update(
      "incidents",
      incident.id,
      recalculate(incident, req.body || {})
    )
  );
});

/**
 * POST /api/incidents/:id/close - finish an outage in one request:
 * mark it resolved, write the all-clear and publish it everywhere.
 */
api.post("/incidents/:id/close", requireSession, async (req, res) => {
  const incident = await findById("incidents", req.params.id);
  if (!incident) return res.status(404).json({ error: "not_found" });

  const resolved = await update("incidents", incident.id, {
    status: "resolved",
    resolvedAt: nowIso(),
  });
  const draft = await insert("drafts", await makeDraft(resolved, "allclear"));
  await update("drafts", draft.id, {
    status: "published",
    publishedAt: nowIso(),
    sentBy: req.worker,
  });

  const publication = await publishEverywhere(
    resolved,
    await findById("drafts", draft.id),
    { by: req.worker }
  );
  if (!resolved.publishedAt)
    await update("incidents", resolved.id, { publishedAt: publication.at });

  res.json({ incident: await findById("incidents", resolved.id), publication });
});

/* ------------------------------------------------------------------ drafts */
/** Build a draft: all four languages plus the silent quality checks. */
async function makeDraft(incident, kind) {
  const messages = await composeAll(incident, kind, incident.variant || 0);
  const { checks, allOk } = await runChecks(messages.de, incident);
  return {
    id: makeId("DRF"),
    incidentId: incident.id,
    kind,
    status: "draft", // draft | published
    createdAt: nowIso(),
    publishedAt: null,
    messages,
    checks,
    allOk,
    edited: false,
  };
}

api.get("/drafts", requireSession, async (req, res) => {
  res.json(
    [...(await all()).drafts].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
  );
});

api.post("/drafts", requireSession, async (req, res) => {
  const incident = await findById("incidents", req.body?.incidentId);
  if (!incident) return res.status(404).json({ error: "incident_not_found" });
  const kind =
    req.body?.kind || (incident.status === "resolved" ? "allclear" : "first");
  res.status(201).json(await insert("drafts", await makeDraft(incident, kind)));
});

/** Edit the German text; the checks run again immediately. */
api.put("/drafts/:id", async (req, res) => {
  const draft = await findById("drafts", req.params.id);
  if (!draft) return res.status(404).json({ error: "not_found" });
  const incident = await findById("incidents", draft.incidentId);

  // The edit is the new truth: the HTML that goes to Heimat-Info has to be
  // rebuilt from it, otherwise the post would still show the original.
  const text = String(req.body?.text ?? draft.messages.de.text);
  const edited = { ...draft.messages.de, text, html: textToHtml(text) };
  const { checks, allOk } = await runChecks(edited, incident);

  res.json(
    await update("drafts", draft.id, (d) => {
      d.messages.de = edited;
      d.checks = checks;
      d.allOk = allOk;
      d.edited = true;
    })
  );
});

/**
 * DELETE /api/drafts/:id - throw away a text that has not been sent.
 *
 * If this was the only draft of an incident that was never published, the
 * incident goes with it: an accidental report should leave nothing behind.
 */
api.delete("/drafts/:id", async (req, res) => {
  const draft = await findById("drafts", req.params.id);
  if (!draft) return res.status(404).json({ error: "not_found" });
  if (draft.status === "published")
    return res.status(409).json({ error: "already_published" });

  replace(
    "drafts",
    (await all()).drafts.filter((d) => d.id !== draft.id)
  );

  const incident = await findById("incidents", draft.incidentId);
  const everSent =
    incident &&
    (await all()).publications.some((p) => p.incidentId === incident.id);
  const orphan =
    incident &&
    !everSent &&
    !(await all()).drafts.some((d) => d.incidentId === incident.id);
  if (orphan)
    replace(
      "incidents",
      (await all()).incidents.filter((i) => i.id !== incident.id)
    );

  res.json({ ok: true, incidentRemoved: Boolean(orphan) });
});

/**
 * POST /api/drafts/:id/regenerate - write the text again.
 *
 * Used after a manual edit went wrong, or to change how the message sounds.
 * A tone given here is remembered on the incident, so every later update and
 * the all-clear keep the same voice.
 * Body: { tone?: 'reassuring'|'steady'|'careful'|'light' }
 */
api.post("/drafts/:id/regenerate", requireSession, async (req, res) => {
  const draft = await findById("drafts", req.params.id);
  if (!draft) return res.status(404).json({ error: "not_found" });
  if (draft.status === "published")
    return res.status(409).json({ error: "already_published" });

  const incident = await findById("incidents", draft.incidentId);
  if (!incident) return res.status(404).json({ error: "incident_not_found" });

  const tone = req.body?.tone;
  const patch = {};
  if (["reassuring", "steady", "careful", "light"].includes(tone))
    patch.toneOverride = tone;
  // "write the text again" asks for different words, so move to the next
  // phrasing; without this the same sentences would come back every time.
  if (req.body?.shuffle) patch.variant = (incident.variant || 0) + 1;

  const updated = Object.keys(patch).length
    ? await update("incidents", incident.id, patch)
    : incident;

  const messages = await composeAll(updated, draft.kind, updated.variant || 0);
  const { checks, allOk } = await runChecks(messages.de, updated);

  res.json(
    await update("drafts", draft.id, (d) => {
      d.messages = messages;
      d.checks = checks;
      d.allOk = allOk;
      d.edited = false;
    })
  );
});

/** The one click that sends the message to every channel. */
api.post("/drafts/:id/publish", requireSession, async (req, res) => {
  const draft = await findById("drafts", req.params.id);
  if (!draft) return res.status(404).json({ error: "not_found" });
  if (draft.status === "published")
    return res.status(409).json({ error: "already_published" });

  const incident = await findById("incidents", draft.incidentId);
  if (!incident) return res.status(404).json({ error: "incident_not_found" });

  await update("drafts", draft.id, {
    status: "published",
    publishedAt: nowIso(),
    sentBy: req.worker,
  });
  const publication = await publishEverywhere(
    incident,
    await findById("drafts", draft.id),
    { by: req.worker }
  );
  if (!incident.publishedAt)
    await update("incidents", incident.id, { publishedAt: publication.at });

  res.json({ draft: await findById("drafts", draft.id), publication });
});

api.get("/publications", requireSession, async (req, res) => {
  res.json(
    [...(await all()).publications].sort((a, b) => b.at.localeCompare(a.at))
  );
});

/* ----------------------------------------------- machine-readable for others */
/** Open data for the city website and any other system. No login needed. */
api.get("/public/status", async (req, res) => {
  const lang = ["de", "en", "fr", "es"].includes(req.query.lang)
    ? req.query.lang
    : "de";
  const db = await all();

  const items = await Promise.all(
    db.incidents.map(async (incident) => {
      const pubs = db.publications.filter((p) => p.incidentId === incident.id);
      if (pubs.length === 0) return null;
      const latest = pubs[pubs.length - 1];
      const message = latest.messages[lang] || latest.messages.de;
      const districts = await getDistricts(incident.districts);
      return {
        id: incident.id,
        service: incident.service,
        status: incident.status,
        presetId: incident.presetId,
        title: message.title,
        text: message.text,
        districts: districts.map(({ id, name }) => ({
          id,
          name,
        })),
        startedAt: incident.startedAt,
        etaAt: incident.etaAt,
        resolvedAt: incident.resolvedAt,
        publishedAt: latest.at,
        kind: latest.kind,
      };
    })
  )
    .filter(Boolean)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  res.json({
    lang,
    generatedAt: nowIso(),
    active: items.filter((i) => i.status !== "resolved"),
    resolved: items.filter((i) => i.status === "resolved").slice(0, 10),
  });
});

export async function rssHandler(req, res) {
  const items = (await all()).publications
    .slice(-20)
    .reverse()
    .map((p) => ({
      id: p.id,
      title: p.messages.de.title,
      text: p.messages.de.text,
      at: p.at,
    }));
  // Use configured public base URL, fallback to request host for development
  const baseUrl =
    config.publicBaseUrl || `${req.protocol}://${req.get("host")}`;
  res.type("application/rss+xml").send(buildRss(items, baseUrl));
}

/** A self-contained HTML page the city can embed in an iframe. */
export async function widgetHandler(req, res) {
  const active = (await all()).incidents.filter(
    (i) => i.status !== "resolved" && i.publishedAt
  );

  const rows = await Promise.all(
    active.map(async (i) => {
      const s = (await getService(i.service)) || {
        icon: "",
        name: { de: i.service },
      };
      const names = (await getDistricts(i.districts))
        .map((d) => d.name)
        .join(", ");
      return `<li style="padding:12px 0;border-bottom:1px solid #e3e9f0">
      <strong>${s.icon} ${s.name.de}</strong> – ${names}<br>
      <span style="color:#4b5a6e;font-size:14px">seit ${localTime(
        i.startedAt
      )} · voraussichtlich bis ${localTime(i.etaAt)}</span>
    </li>`;
    })
  ).join("");

  res.type("html")
    .send(`<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Störungsmeldungen</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#121a26;font-size:16px">
  <div style="padding:14px 16px;background:#0a2e52;color:#fff;font-weight:700">⚡ Stadtwerke Plattling – Aktuelle Störungen</div>
  <ul style="list-style:none;margin:0;padding:0 16px">
    ${
      rows ||
      '<li style="padding:16px 0;color:#0f7a3d;font-weight:600">✅ Zurzeit keine Störungen bekannt.</li>'
    }
  </ul>
  <div style="padding:10px 16px;color:#4b5a6e;font-size:13px">Stand: ${localTime(
    nowIso()
  )}</div>
</body></html>`);
}

/* ----------------------------------------------------------- User Profile Management */
/**
 * User profile endpoints for managing personal information
 */

// Test endpoint
api.get("/user/test", requireSession, async (req, res) => {
  res.json({ message: "User routes are working", worker: req.worker.id });
});

// Get current user profile
api.get("/user/profile", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    let user = await User.findOne({ workerId: req.worker.id });

    // Create user profile if it doesn't exist
    if (!user) {
      user = await User.create({
        workerId: req.worker.id,
        name: req.worker.name,
        pin: "", // Will be set by admin
        email: "",
        phone: "",
        department: "",
        lastLogin: new Date(),
        isActive: true,
        role: "worker",
        preferences: {
          language: "de",
          theme: "light",
          notifications: true,
        },
      });
    }

    // Don't return PIN in response
    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Return worker data even if MongoDB fails
    res.json({
      workerId: req.worker.id,
      name: req.worker.name,
      email: "",
      phone: "",
      department: "",
      lastLogin: new Date(),
      preferences: {
        language: "de",
        theme: "light",
        notifications: true,
      },
    });
  }
});

// Update user profile
api.put("/user/profile", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    const updates = req.body;

    // Don't allow changing workerId
    delete updates.workerId;

    // Simple direct update - set each field individually
    const updateFields = {};
    if (updates.name !== undefined) updateFields.name = updates.name;
    if (updates.email !== undefined) updateFields.email = updates.email;
    if (updates.phone !== undefined) updateFields.phone = updates.phone;
    if (updates.department !== undefined)
      updateFields.department = updates.department;

    const user = await User.findOneAndUpdate(
      { workerId: req.worker.id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // Don't return PIN in response
    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    res
      .status(500)
      .json({ error: "failed_to_update_profile", details: error.message });
  }
});

// Update user PIN
api.put("/user/pin", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin || newPin.length < 6) {
      return res.status(400).json({ error: "invalid_pin_length" });
    }

    const user = await User.findOne({ workerId: req.worker.id });
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Verify current PIN
    if (user.pin !== currentPin) {
      return res.status(401).json({ error: "wrong_current_pin" });
    }

    // Update PIN
    user.pin = newPin;
    await user.save();

    // ADD THIS LINE: Clear the cache so the next login uses the new PIN immediately
    invalidateWorkersCache();

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating PIN:", error);
    res.status(500).json({ error: "failed_to_update_pin" });
  }
});

// Update last login time
api.post("/user/last-login", requireSession, async (req, res) => {
  try {
    const User = (await import("../lib/mongodb.js")).User;
    await User.findOneAndUpdate(
      { workerId: req.worker.id },
      { lastLogin: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating last login:", error);
    res.status(500).json({ error: "failed_to_update_last_login" });
  }
});

/* ----------------------------------------------------------- Admin User Management */
/**
 * Admin endpoints for managing users in MongoDB
 * These endpoints allow dynamic user management without editing config files
 */

// Check if current user is admin
function isAdmin(worker) {
  // For now, all workers are admins for testing
  // In production, check worker.role === "admin"
  return true;
}

// List all users (admin only)
api.get("/admin/users", requireSession, async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.worker)) {
      return res.status(403).json({ error: "admin_required" });
    }

    const { User } = await import("../lib/mongodb.js");
    const users = await User.find({}).lean();

    // Don't return PINs in the list
    const usersWithoutPins = users.map(({ pin, ...user }) => user);
    res.json(usersWithoutPins);
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "failed_to_list_users" });
  }
});

// Create new user (admin only)
api.post("/admin/users", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker)) {
      return res.status(403).json({ error: "admin_required" });
    }

    const { User } = await import("../lib/mongodb.js");
    const { workerId, name, pin, email, phone, department, role } = req.body;

    // Validate required fields
    if (!workerId || !name || !pin) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    // Check if user already exists
    const existing = await User.findOne({ workerId });
    if (existing) {
      return res.status(409).json({ error: "user_already_exists" });
    }

    // Validate PIN length
    if (pin.length < 6) {
      return res.status(400).json({ error: "pin_too_short" });
    }

    // Create user
    const user = await User.create({
      workerId,
      name,
      pin,
      email: email || "",
      phone: phone || "",
      department: department || "",
      isActive: true,
      role: role || "worker",
      lastLogin: new Date(),
      preferences: {
        language: "de",
        theme: "light",
        notifications: true,
      },
    });

    // Don't return PIN in response
    const { pin: _, ...userWithoutPin } = user.toObject();
    res.status(201).json(userWithoutPin);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      res.status(409).json({ error: "user_already_exists" });
    } else {
      res
        .status(500)
        .json({ error: "failed_to_create_user", details: error.message });
    }
  }
});

// Update user (admin only)
api.put("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker)) {
      return res.status(403).json({ error: "admin_required" });
    }

    const { User } = await import("../lib/mongodb.js");
    const updates = req.body;
    const { workerId } = req.params;

    // Don't allow changing workerId
    delete updates.workerId;

    const user = await User.findOneAndUpdate(
      { workerId },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Don't return PIN in response
    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "failed_to_update_user" });
  }
});

// Delete user (admin only)
api.delete("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker)) {
      return res.status(403).json({ error: "admin_required" });
    }

    const { User } = await import("../lib/mongodb.js");
    const { workerId } = req.params;

    const user = await User.findOneAndDelete({ workerId });

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "failed_to_delete_user" });
  }
});

// Reset user PIN (admin only)
api.post(
  "/admin/users/:workerId/reset-pin",
  requireSession,
  async (req, res) => {
    try {
      if (!isAdmin(req.worker)) {
        return res.status(403).json({ error: "admin_required" });
      }

      const { User } = await import("../lib/mongodb.js");
      const { workerId } = req.params;
      const { newPin } = req.body;

      if (!newPin || newPin.length < 6) {
        return res.status(400).json({ error: "invalid_pin" });
      }

      const user = await User.findOneAndUpdate(
        { workerId },
        { $set: { pin: newPin } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "user_not_found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting PIN:", error);
      res.status(500).json({ error: "failed_to_reset_pin" });
    }
  }
);

