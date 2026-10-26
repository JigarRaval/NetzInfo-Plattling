/**
 * api.js - all HTTP endpoints of the application.
 */

import express from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
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
import { User } from "../lib/mongodb.js";

export const api = express.Router();

// Initialize store before server starts
import { initializeStore } from "../lib/store.js";
initializeStore();

/**
 * GET /api/geocode/reverse?lat=&lng=
 */
api.get("/geocode/reverse", async (req, res) => {
  const place = await reverseGeocode(
    Number(req.query.lat),
    Number(req.query.lng)
  );
  res.json({ place });
});

/* -------------------------------------------------------------------- login */
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

api.post("/auth/verify", requireSession, (req, res) => res.json({ ok: true }));

api.get("/auth/state", requireSession, async (req, res) => {
  const worker = req.worker
    ? { id: req.worker.id, name: req.worker.name }
    : null;
  res.json({
    required: config.auth.enabled,
    team: config.auth.teamName,
    workers: await workerList(),
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
api.get("/catalog", requireSession, async (req, res) => {
  res.json({
    services: await allServices(),
    districts: await allDistricts(),
    presets: await allPresets(),
    channels: channelList(),
  });
});

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

api.post("/catalog/services", requireSession, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name_required" });

  const service = {
    id: `c_${slugify(name)}`,
    icon: String(req.body?.icon || "⚠️").slice(0, 4),
    custom: true,
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

api.post("/incidents", requireSession, async (req, res) => {
  const input = req.body || {};

  const duplicate = await findDuplicate(input);
  if (duplicate) {
    return res
      .status(409)
      .json({ error: "already_running", incident: duplicate });
  }

  const created = await insert(
    "incidents",
    await buildIncident({ ...input, reportedBy: req.worker })
  );
  res.status(201).json(created);
});

api.delete("/incidents/:id", async (req, res) => {
  const incident = await findById("incidents", req.params.id);
  if (!incident) return res.status(404).json({ error: "not_found" });

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
async function makeDraft(incident, kind) {
  const messages = await composeAll(incident, kind, incident.variant || 0);
  const { checks, allOk } = await runChecks(messages.de, incident);
  return {
    id: makeId("DRF"),
    incidentId: incident.id,
    kind,
    status: "draft",
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

api.put("/drafts/:id", async (req, res) => {
  const draft = await findById("drafts", req.params.id);
  if (!draft) return res.status(404).json({ error: "not_found" });
  const incident = await findById("incidents", draft.incidentId);

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
  const baseUrl =
    config.publicBaseUrl || `${req.protocol}://${req.get("host")}`;
  res.type("application/rss+xml").send(buildRss(items, baseUrl));
}

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

api.get("/user/test", requireSession, async (req, res) => {
  res.json({ message: "User routes are working", worker: req.worker.id });
});

api.get("/user/profile", requireSession, async (req, res) => {
  try {
    let user = await User.findOne({ workerId: req.worker.id });

    if (!user) {
      user = await User.create({
        workerId: req.worker.id,
        name: req.worker.name,
        pin: "000000", // Will hash automatically
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

    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    console.error("Error fetching user profile:", error);
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

api.put("/user/profile", requireSession, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.workerId;
    delete updates.pin;

    let user = await User.findOne({ workerId: req.worker.id });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.department !== undefined) user.department = updates.department;

    await user.save();

    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    res
      .status(500)
      .json({ error: "failed_to_update_profile", details: error.message });
  }
});

api.put("/user/pin", requireSession, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin || newPin.length < 6) {
      return res.status(400).json({ error: "invalid_pin_length" });
    }

    const user = await User.findOne({ workerId: req.worker.id });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const isMatch = await bcrypt.compare(currentPin, user.pin);
    if (!isMatch) return res.status(401).json({ error: "wrong_current_pin" });

    user.pin = newPin;
    await user.save();
    invalidateWorkersCache();

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating PIN:", error);
    res.status(500).json({ error: "failed_to_update_pin" });
  }
});

api.post("/user/last-login", requireSession, async (req, res) => {
  try {
    const user = await User.findOne({ workerId: req.worker.id });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating last login:", error);
    res.status(500).json({ error: "failed_to_update_last_login" });
  }
});

/* ----------------------------------------------------------- Admin User Management */

function isAdmin(worker) {
  return true; // For now, all workers are admins for testing
}

api.get("/admin/users", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const users = await User.find({});
    const usersWithoutPins = users.map((u) => {
      const obj = u.toObject();
      delete obj.pin;
      return obj;
    });
    res.json(usersWithoutPins);
  } catch (error) {
    res.status(500).json({ error: "failed_to_list_users" });
  }
});

api.post("/admin/users", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const { workerId, name, pin, email, phone, department, role } = req.body;

    if (!workerId || !name || !pin)
      return res.status(400).json({ error: "missing_required_fields" });
    const existing = await User.findOne({ workerId });
    if (existing) return res.status(409).json({ error: "user_already_exists" });
    if (pin.length < 6) return res.status(400).json({ error: "pin_too_short" });

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
      preferences: { language: "de", theme: "light", notifications: true },
    });

    const { pin: _, ...userWithoutPin } = user.toObject();
    res.status(201).json(userWithoutPin);
  } catch (error) {
    if (error.code === 11000)
      res.status(409).json({ error: "user_already_exists" });
    else
      res
        .status(500)
        .json({ error: "failed_to_create_user", details: error.message });
  }
});

api.put("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const updates = req.body;
    const { workerId } = req.params;

    delete updates.workerId;
    delete updates.pin;

    const user = await User.findOne({ workerId });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    Object.assign(user, updates);
    await user.save();

    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    res.status(500).json({ error: "failed_to_update_user" });
  }
});

api.delete("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const user = await User.findOneAndDelete({ workerId: req.params.workerId });
    if (!user) return res.status(404).json({ error: "user_not_found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "failed_to_delete_user" });
  }
});

api.post(
  "/admin/users/:workerId/reset-pin",
  requireSession,
  async (req, res) => {
    try {
      if (!isAdmin(req.worker))
        return res.status(403).json({ error: "admin_required" });
      const { workerId } = req.params;
      const { newPin } = req.body;

      if (!newPin || newPin.length < 6)
        return res.status(400).json({ error: "invalid_pin" });

      const user = await User.findOne({ workerId });
      if (!user) return res.status(404).json({ error: "user_not_found" });

      user.pin = newPin;
      await user.save();
      invalidateWorkersCache();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "failed_to_reset_pin" });
    }
  }
);
