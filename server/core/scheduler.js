/**
 * scheduler.js - Flags overdue incidents and prepares delay drafts.
 *
 * Instead of auto-publishing (which can send wrong info), this timer checks
 * for incidents that have passed their ETA. If found, it silently creates a
 * "draft" with the delay message and flags it. The worker will see this on
 * the Home screen, adjust the time, edit the text, and send it manually.
 */

import { all, insert, findById, update } from "../lib/store.js";
import { config } from "../config.js";
import { composeAll } from "./compose.js";
import { runChecks } from "./quality.js";
import { makeId, nowIso } from "../lib/time.js";

/** Which incidents are due for an automatic update right now? */
async function dueIncidents() {
  const db = await all();

  return db.incidents.filter((incident) => {
    // Only check published, unresolved incidents
    if (incident.status === "resolved" || !incident.publishedAt) return false;

    // Only check if the ETA has actually passed
    const etaPassed = new Date(incident.etaAt).getTime() < Date.now();
    if (!etaPassed) return false;

    // Check if we ALREADY created a draft for this delay
    // (We don't want to create a new draft every minute)
    const hasPendingDraft = db.drafts.some(
      (d) => d.incidentId === incident.id && d.status === "draft" && d.auto
    );

    return !hasPendingDraft;
  });
}

/** Prepare a draft for the worker to review. */
async function prepareDelayDraft(incident) {
  // Generate the text using the current ETA
  const messages = await composeAll(incident, "update", incident.variant || 0);
  const { checks, allOk } = await runChecks(messages.de, incident);

  // Create the draft (status = "draft", NOT "published")
  await insert("drafts", {
    id: makeId("DRF"),
    incidentId: incident.id,
    kind: "update",
    status: "draft", // <--- Changed from "published"
    createdAt: nowIso(),
    publishedAt: null,
    messages,
    checks,
    allOk,
    edited: false,
    auto: true, // Flag so we don't create infinite drafts
  });

  console.log(
    `[stadtwerke] Prepared delay draft for overdue incident ${incident.id}`
  );
}

/** Start the timer. Called once when the server boots. */
export function startScheduler() {
  if (!config.autoUpdate.enabled) {
    console.log("[stadtwerke] automatic updates are switched off");
    return;
  }

  console.log(`[stadtwerke] checking for overdue incidents every minute`);

  setInterval(async () => {
    for (const incident of await dueIncidents()) {
      try {
        await prepareDelayDraft(incident);
      } catch (error) {
        console.error(
          "[stadtwerke] failed to prepare delay draft:",
          error.message
        );
      }
    }
  }, 60 * 1000);
}
