/**
 * demo.js — reproducible demo data.
 *
 * A pitch must never depend on luck: this creates one active incident whose
 * publication took exactly 1:47 (the number used in the pitch) and one
 * resolved incident so the all-clear is visible straight away.
 */

import { replace, insert } from "../lib/store.js";
import { buildIncident } from "../core/incidents.js";
import { composeAll, composePressRelease } from "../core/compose.js";
import { runChecks } from "../core/quality.js";
import { makeId, nowIso } from "../lib/time.js";

/** A publication record built without calling any external channel. */
async function fakePublication(incident, kind, seconds) {
  // The seeded publications carry the same measurement fields as real ones,
  // so the dashboard can label them exactly like live data.
  const messages = await composeAll(incident, kind);
  const results = [
    {
      channel: "statuspage",
      icon: "globe",
      ok: true,
      ms: 4,
      messageKey: "ch_msg_updated",
      params: {},
    },
    {
      channel: "rss",
      icon: "radio",
      ok: true,
      ms: 3,
      messageKey: "ch_msg_regenerated",
      params: {},
    },
    {
      channel: "widget",
      icon: "puzzle",
      ok: true,
      ms: 2,
      messageKey: "ch_msg_updated",
      params: {},
    },
    {
      channel: "push",
      icon: "bell",
      ok: true,
      ms: 5,
      messageKey: "ch_msg_push_created",
      params: { chars: messages.de.short.length },
    },
    {
      channel: "heimatinfo",
      icon: "home",
      ok: false,
      skipped: true,
      ms: 0,
      messageKey: "ch_msg_hi_not_configured",
      params: {},
    },
  ];
  return {
    id: makeId("PUB"),
    incidentId: incident.id,
    kind,
    at: nowIso(),
    measure: kind === "first" ? "first" : "followup",
    measuredFrom: new Date(Date.now() - seconds * 1000).toISOString(),
    messages: Object.fromEntries(
      Object.entries(messages).map(([l, m]) => [
        l,
        { title: m.title, text: m.text, short: m.short },
      ])
    ),
    html: messages.de.html,
    results,
    okCount: results.filter((r) => r.ok).length,
    totalCount: results.length,
    kpiSeconds: seconds,
  };
}

/** An already approved draft belonging to a seeded publication. */
async function approvedDraft(incident, kind) {
  const messages = await composeAll(incident, kind);
  const { checks, allOk } = await runChecks(messages.de, incident);
  return {
    id: makeId("DRF"),
    incidentId: incident.id,
    kind,
    status: "approved",
    createdAt: nowIso(),
    approvedAt: nowIso(),
    approvedBy: "Leitstelle",
    messages,
    checks,
    allOk,
    edited: false,
  };
}

export async function seedDemo() {
  for (const c of ["incidents", "drafts", "publications", "outbox"])
    await replace(c, []);
  const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

  // 1. Active water incident — published in 1:47, the pitch number.
  const water = await buildIncident({
    presetId: "wasser_rohrbruch",
    districts: ["stadtmitte", "pankofen"],
    street: "Bahnhofstraße / Ecke Preysingplatz",
    etaMinutes: 240,
    source: "preset",
    capturedAt: minutesAgo(42),
    startedAt: minutesAgo(55),
  });
  await insert("incidents", { ...water, publishedAt: minutesAgo(40) });
  await insert("drafts", await approvedDraft(water, "first"));
  await insert("publications", await fakePublication(water, "first", 107));

  // 2. Resolved electricity incident — shows the all-clear in the history.
  const power = await buildIncident({
    presetId: "strom_ausfall",
    districts: ["enzkofen"],
    etaMinutes: 90,
    source: "form",
    capturedAt: minutesAgo(300),
    startedAt: minutesAgo(310),
  });
  const resolved = {
    ...power,
    status: "resolved",
    resolvedAt: minutesAgo(180),
    publishedAt: minutesAgo(295),
  };
  await insert("incidents", resolved);
  await insert("drafts", await approvedDraft(resolved, "allclear"));
  await insert("publications", await fakePublication(resolved, "first", 94));
  await insert("publications", await fakePublication(resolved, "allclear", 61));

  // 3. One press release in the outbox so the Connect screen is not empty.
  await insert("outbox", {
    id: makeId("PRESS"),
    channel: "press",
    at: minutesAgo(39),
    incidentId: water.id,
    body: await composePressRelease(water, "first"),
  });

  return { incidents: 2, drafts: 2, publications: 3 };
}
