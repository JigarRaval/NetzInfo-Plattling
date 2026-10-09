/**
 * incidents.js - build and compare incident records.
 *
 * An incident stores identifiers (preset id, district ids), never finished
 * text, so the same record can be rendered in any language later.
 */

import { getPreset } from "../data/catalog.js";
import { makeId, nowIso, addMinutes } from "../lib/time.js";
import { all } from "../lib/store.js";

/**
 * Duplicate detection: same utility, an overlapping district and reported
 * within 90 minutes is almost certainly the same event, so the interface can
 * offer an update instead of creating a second incident.
 */
export function findDuplicate(input) {
  const service = input.service || getPreset(input.presetId)?.service;
  const districts = input.districts?.length ? input.districts : [];
  const cutoff = Date.now() - 90 * 60 * 1000;

  return (
    all().incidents.find(
      (inc) =>
        inc.status !== "resolved" &&
        inc.service === service &&
        new Date(inc.capturedAt).getTime() >= cutoff &&
        inc.districts.some((d) => districts.includes(d))
    ) || null
  );
}

/** Create a complete incident from a possibly very sparse report. */
export function buildIncident(input) {
  const preset = getPreset(input.presetId);
  const districts = input.districts?.length ? input.districts : ["stadtmitte"];
  const capturedAt = input.capturedAt || nowIso();
  const etaMinutes = Number(input.etaMinutes || preset?.etaMinutes || 120);

  return {
    id: makeId("INC"),
    service: input.service || preset?.service || "strom",
    presetId: input.presetId || null,
    districts,
    street: input.street || "",
    coords: input.coords || null,
    radiusMeters: input.radiusMeters || null, // affected area radius in meters
    boilNotice: Boolean(preset?.boilNotice),
    planned: Boolean(preset?.planned),
    startedAt: input.startedAt || capturedAt,
    etaMinutes,
    etaAt: addMinutes(capturedAt, etaMinutes),
    note: input.note || "",
    toneOverride: null, // set when the tone is changed by hand
    variant: 0, // which phrasing; raised by "write it again"
    reportedBy: input.reportedBy || null, // { id, name } of the person on shift
    source: input.source || "preset",
    status: "active", // active | resolved
    capturedAt,
    publishedAt: null,
    resolvedAt: null,
  };
}

/** Recalculate the derived fields after an edit. */
export function recalculate(incident, patch) {
  const merged = { ...incident, ...patch };
  return {
    ...patch,
    etaMinutes: Number(merged.etaMinutes),
    etaAt: addMinutes(incident.capturedAt, Number(merged.etaMinutes)),
  };
}
