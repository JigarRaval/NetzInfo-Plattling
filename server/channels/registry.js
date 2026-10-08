/**
 * registry.js — the channel list and the parallel fan-out.
 *
 * Every channel implements the same tiny contract:
 *   send(context) -> { ok, skipped?, messageKey, params?, postId? }
 * Adding a channel means adding one entry to CHANNELS and one translation
 * key — nothing else in the system changes.
 */

import { insert } from "../lib/store.js";
import * as push from "../lib/push.js";
import { config } from "../config.js";
import { makeId, nowIso, secondsBetween } from "../lib/time.js";
import { composeAll } from "../core/compose.js";
import * as heimat from "./heimatinfo.js";

/** Channels served by this application itself. */
const statusPage = {
  id: "statuspage",
  icon: "🌐",
  // The public page reads the same records we store, so publishing is instant
  // and the page can never drift out of sync with the database.
  async send() {
    return { ok: true, messageKey: "ch_msg_updated" };
  },
};

const rss = {
  id: "rss",
  icon: "📡",
  async send() {
    return { ok: true, messageKey: "ch_msg_regenerated" };
  },
};

const widget = {
  id: "widget",
  icon: "🧩",
  async send() {
    return { ok: true, messageKey: "ch_msg_updated" };
  },
};

/**
 * Real browser push. Everyone who allowed notifications gets the short form
 * delivered by the operating system, even with the page closed. A copy is
 * always written to the outbox so the message is never lost.
 */
const pushChannel = {
  id: "push",
  icon: "🔔",
  async send({ incident, message }) {
    insert("outbox", {
      id: makeId("PUSH"),
      channel: "push",
      at: nowIso(),
      incidentId: incident.id,
      title: message.title,
      body: message.short,
    });

    const result = await push.sendToAll({
      title: message.title,
      body: message.short,
      url: "/",
    });
    if (!result.available) {
      return { ok: true, messageKey: "ch_msg_push_stored", params: {} };
    }
    return {
      ok: true,
      messageKey:
        result.total === 0 ? "ch_msg_push_nobody" : "ch_msg_push_sent",
      params: { delivered: result.delivered, total: result.total },
    };
  },
};

/** A genuine outgoing HTTP POST; falls back to a local sink when unconfigured. */
const webhook = {
  id: "webhook",
  icon: "🔗",
  async send({ incident, message, messages }) {
    const url = config.webhookUrl;
    const payload = {
      event: "outage.published",
      incidentId: incident.id,
      service: incident.service,
      severity: incident.severity,
      districts: incident.districts,
      startedAt: incident.startedAt,
      etaAt: incident.etaAt,
      title: message.title,
      text: message.text,
      translations: Object.fromEntries(
        Object.entries(messages).map(([l, m]) => [l, m.text])
      ),
    };

    if (!url) {
      insert("outbox", {
        id: makeId("HOOK"),
        channel: "webhook",
        at: nowIso(),
        incidentId: incident.id,
        payload,
      });
      return { ok: true, messageKey: "ch_msg_webhook_local" };
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      return {
        ok: res.ok,
        messageKey: "ch_msg_webhook_sent",
        params: { status: res.status },
      };
    } catch (err) {
      return {
        ok: false,
        messageKey: "ch_msg_webhook_failed",
        params: { detail: err.message },
      };
    }
  },
};

/** The editorial system receives a formal press release for every message. */
const press = {
  id: "press",
  icon: "📰",
  async send({ incident, pressRelease }) {
    insert("outbox", {
      id: makeId("PRESS"),
      channel: "press",
      at: nowIso(),
      incidentId: incident.id,
      body: pressRelease,
    });
    return {
      ok: true,
      messageKey: "ch_msg_press_sent",
      params: { chars: pressRelease.length },
    };
  },
};

/** The external platform, wrapped in the same contract. */
const heimatInfo = {
  id: "heimatinfo",
  icon: "🏘️",
  external: true,
  async send({ incident, message }) {
    return heimat.publishPost({
      title: message.title,
      htmlContent: message.html,
      externalId: incident.id,
    });
  },
};

export const CHANNELS = [
  statusPage,
  rss,
  widget,
  pushChannel,
  heimatInfo,
  webhook,
  press,
];

/** Channel metadata for the interface (names come from the translations). */
export function channelList() {
  return CHANNELS.map((c) => ({
    id: c.id,
    icon: c.icon,
    external: Boolean(c.external),
  }));
}

/**
 * Publish an incident to every applicable channel AT THE SAME TIME.
 * The KPI is wall-clock time, so a slow external system must not delay the
 * others; each channel also fails independently.
 *
 * MEASUREMENT (this is the headline KPI, so it must measure the right thing):
 *   first notice  -> from the moment the incident was CAPTURED to publication.
 *                    That is the promise of the project: report to informed.
 *   update / all-clear -> from the moment THIS MESSAGE was created to
 *                    publication. Measuring from the original capture would
 *                    report the age of the outage (hours), not communication
 *                    speed, which is meaningless and was wrong before.
 */
export async function publishEverywhere(incident, draft, options = {}) {
  const kind = draft.kind;

  // Send exactly what was on screen when the button was pressed, including
  // any manual edit. Re-composing here used to silently discard the edit.
  const messages =
    draft.messages || composeAll(incident, kind, incident.variant);
  const message = messages.de; // German is the lead version

  const stamp = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const pressRelease = [
    "PRESSEMITTEILUNG – Stadtwerke Plattling",
    `Plattling, ${stamp}`,
    "",
    message.text,
    "",
    "Rückfragen: Pressestelle der Stadtwerke Plattling",
  ].join("\n");

  const targets = CHANNELS; // every channel is served every time

  const results = await Promise.all(
    targets.map(async (channel) => {
      const t0 = Date.now();
      try {
        const r = await channel.send({
          incident,
          message,
          messages,
          pressRelease,
          kind,
        });
        return {
          channel: channel.id,
          icon: channel.icon,
          ms: Date.now() - t0,
          params: {},
          ...r,
        };
      } catch (err) {
        return {
          channel: channel.id,
          icon: channel.icon,
          ms: Date.now() - t0,
          ok: false,
          messageKey: "ch_msg_error",
          params: { detail: err.message },
        };
      }
    })
  );

  const at = nowIso();

  // Pick the correct start point for the stopwatch (see the comment above).
  const measure = kind === "first" ? "first" : "followup";
  const measuredFrom =
    measure === "first" ? incident.capturedAt : draft.createdAt;

  const publication = {
    id: makeId("PUB"),
    incidentId: incident.id,
    draftId: draft.id,
    kind,
    at,
    auto: Boolean(options.auto), // true when the scheduler sent it
    sentBy: options.by || null, // { id, name }, or null for the scheduler
    measure, // 'first' | 'followup' - tells the UI what to label
    measuredFrom, // the exact timestamp the clock started at
    // All four languages are stored, so every channel and every reader gets
    // the same facts in their own language.
    messages: Object.fromEntries(
      Object.entries(messages).map(([l, m]) => [
        l,
        { title: m.title, text: m.text, short: m.short },
      ])
    ),
    html: message.html,
    results,
    okCount: results.filter((r) => r.ok).length,
    totalCount: results.length,
    kpiSeconds: secondsBetween(measuredFrom, at),
  };

  insert("publications", publication);
  return publication;
}

/** Valid RSS 2.0 built from the stored publications. */
export function buildRss(items, baseUrl = "") {
  const esc = (s) =>
    String(s).replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
    );
  const entries = items
    .map(
      (i) => `    <item>
      <title>${esc(i.title)}</title>
      <description>${esc(i.text)}</description>
      <guid isPermaLink="false">${esc(i.id)}</guid>
      <pubDate>${new Date(i.at).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Stadtwerke Plattling – Störungsmeldungen</title>
    <link>${baseUrl}/</link>
    <description>Aktuelle Störungen bei Strom, Wasser, Abwasser und Fernwärme</description>
    <language>de-de</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${entries}
  </channel>
</rss>`;
}
