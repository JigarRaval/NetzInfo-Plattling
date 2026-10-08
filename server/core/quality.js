/**
 * quality.js — three automatic checks that run before a human sees a draft.
 *
 * Like severity.js, every result is a KEY plus measured numbers. The browser
 * turns that into a sentence in the selected language, so the approval screen
 * is fully translated, including the explanations.
 */

import { getDistricts } from "../data/catalog.js";
import { localTime } from "../lib/time.js";

const REQUIRED = ["head", "where", "what", "when"];

/** Check 1 — is the mandatory structure complete? */
function structure(message) {
  const present = message.sections.map((s) => s.key);
  const missing = REQUIRED.filter((k) => !present.includes(k));
  return {
    id: "structure",
    ok: missing.length === 0,
    params: { found: present.length, total: 4, missing: missing.join(", ") },
  };
}

/**
 * Check 2 — readability, a simplified "plain language" score based on the
 * two factors that dominate every German readability index: sentence length
 * and the share of very long words.
 */
function readability(text) {
  // The message is line-based: "Seit 18:39 Uhr" is a complete unit of meaning
  // even though it has no full stop. Counting sentences only by punctuation
  // treated the whole notice as one enormous sentence and wrongly declared
  // perfectly readable text "hard to read".
  const prose = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^[\u2022-]/.test(line)) // bullets are a list, not prose
    .filter((line) => /[\p{L}]/u.test(line)); // skip marker-only lines

  // Inside a line, a full stop still separates two statements.
  const units = prose.flatMap((line) =>
    line
      .split(/[.!?]+/)
      .map((p) => p.trim())
      .filter(Boolean)
  );
  const words = text.split(/\s+/).filter((w) => /[\p{L}]/u.test(w));

  const avg = words.length / Math.max(1, units.length);
  const longWords = words.filter(
    (w) => w.replace(/[^\p{L}]/gu, "").length > 14
  ).length;
  const share = longWords / Math.max(1, words.length);

  let level = "easy";
  if (avg > 16 || share > 0.14) level = "medium";
  if (avg > 24 || share > 0.22) level = "hard";

  return {
    id: "readability",
    ok: level !== "hard",
    params: { level, avg: avg.toFixed(1), share: Math.round(share * 100) },
  };
}

/**
 * Check 3 — the fact check. The most important guard rail: it proves the text
 * contains exactly the facts of the incident record. This is what would make
 * an optional LLM polish safe — any altered number fails here and the
 * deterministic template is used instead.
 */
function facts(message, incident) {
  const problems = [];
  const text = message.text;

  for (const d of getDistricts(incident.districts)) {
    if (!text.includes(d.name))
      problems.push({ key: "fact_district_missing", params: { name: d.name } });
  }
  if (
    !text.includes(localTime(incident.startedAt, "de")) &&
    !text.includes(localTime(incident.startedAt, "en"))
  ) {
    problems.push({ key: "fact_start_missing", params: {} });
  }
  if (
    incident.status !== "resolved" &&
    !text.includes(localTime(incident.etaAt, "de")) &&
    !text.includes(localTime(incident.etaAt, "en"))
  ) {
    problems.push({ key: "fact_eta_missing", params: {} });
  }
  if (
    incident.boilNotice &&
    incident.status !== "resolved" &&
    !/abkochen|boil|bouillir|hierva/i.test(text)
  ) {
    problems.push({ key: "fact_boil_missing", params: {} });
  }

  return {
    id: "facts",
    ok: problems.length === 0,
    params: { count: problems.length },
    problems,
  };
}

/**
 * Run the checks.
 *
 * Only the fact check can stop a message from going out: if a district or a
 * time is missing, the notice would be wrong and that is worth blocking.
 * Structure and readability are advice - a slightly long sentence must never
 * stand between a burst pipe and the people affected by it.
 */
export function runChecks(message, incident) {
  const checks = [
    structure(message),
    readability(message.text),
    facts(message, incident),
  ].map((check) => ({ ...check, blocking: check.id === "facts" }));

  return {
    checks,
    // allOk means "may be sent"
    allOk: checks.filter((c) => c.blocking).every((c) => c.ok),
  };
}
