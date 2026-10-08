/**
 * scheduler.js - automatic status updates for long outages.
 *
 * The most common complaint about outage communication is silence: the first
 * notice goes out, and then nothing happens for hours. This timer closes that
 * gap. While an outage is still running, a short update is published every
 * N minutes (30 by default) without anybody having to remember it.
 *
 * Guard rails:
 *   - only for incidents that were already published and are not resolved
 *   - at most `maxPerIncident` automatic messages, so it can never spam
 *   - if the estimate has already passed, it is moved back honestly instead
 *     of repeating a time that is obviously wrong
 */

import { all, insert, findById, update } from "../lib/store.js";
import { config } from "../config.js";
import { composeAll } from "./compose.js";
import { runChecks } from "./quality.js";
import { publishEverywhere } from "../channels/registry.js";
import { makeId, nowIso, addMinutes } from "../lib/time.js";

/** Which incidents are due for an automatic update right now? */
function dueIncidents() {
  const db = all();
  const gap = config.autoUpdate.everyMinutes * 60 * 1000;

  return db.incidents.filter((incident) => {
    if (incident.status === "resolved" || !incident.publishedAt) return false;

    const publications = db.publications.filter(
      (p) => p.incidentId === incident.id
    );
    if (publications.length === 0) return false;

    const automatic = publications.filter((p) => p.auto).length;
    if (automatic >= config.autoUpdate.maxPerIncident) return false;

    const last = publications[publications.length - 1];
    return Date.now() - new Date(last.at).getTime() >= gap;
  });
}

/** Publish one automatic update for a single incident. */
async function sendUpdate(incident) {
  // An estimate in the past helps nobody - move it on before writing the text.
  let current = incident;
  if (new Date(current.etaAt).getTime() < Date.now()) {
    current = update("incidents", current.id, {
      etaAt: addMinutes(nowIso(), config.autoUpdate.extendByMinutes),
    });
  }

  const messages = composeAll(current, "update", current.variant || 0);
  const { checks, allOk } = runChecks(messages.de, current);

  const draft = insert("drafts", {
    id: makeId("DRF"),
    incidentId: current.id,
    kind: "update",
    status: "published",
    createdAt: nowIso(),
    publishedAt: nowIso(),
    messages,
    checks,
    allOk,
    edited: false,
    auto: true,
  });

  await publishEverywhere(current, findById("drafts", draft.id), {
    auto: true,
  });
  console.log(`[netzinfo] automatic update sent for ${current.id}`);
}

/** Start the timer. Called once when the server boots. */
export function startScheduler() {
  if (!config.autoUpdate.enabled) {
    console.log("[netzinfo] automatic updates are switched off");
    return;
  }

  console.log(
    `[netzinfo] automatic updates every ${config.autoUpdate.everyMinutes} minutes`
  );

  // Checking once a minute is accurate enough and costs nothing.
  setInterval(async () => {
    for (const incident of dueIncidents()) {
      try {
        await sendUpdate(incident);
      } catch (error) {
        console.error("[netzinfo] automatic update failed:", error.message);
      }
    }
  }, 60 * 1000);
}
