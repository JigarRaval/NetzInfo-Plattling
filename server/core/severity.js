/**
 * severity.js — the rules that decide how urgent an incident is.
 *
 * IMPORTANT DESIGN RULE: this module returns translation KEYS plus numeric
 * parameters, never finished sentences. That is what allows the whole
 * interface — including the justification shown to the approver — to appear
 * in the language the user selected.
 *
 *   { key: 'sev_households_critical', params: { count: 2720 } }
 */

import { getPreset, countHouseholds, SEVERITIES } from '../data/catalog.js';

export function computeSeverity(input) {
  const reasons = [];
  let rank = 1;

  // Rule 1 — the preset carries a base level (a burst pipe is never "low").
  const preset = getPreset(input.presetId);
  if (preset) {
    rank = Math.max(rank, SEVERITIES[preset.baseSeverity].rank);
    reasons.push({ key: 'sev_preset', params: { preset: preset.id, level: preset.baseSeverity } });
  }

  // Rule 2 — the number of affected households.
  const households = countHouseholds(input.districts);
  if (households >= 2000) { rank = Math.max(rank, 4); reasons.push({ key: 'sev_households_critical', params: { count: households } }); }
  else if (households >= 800) { rank = Math.max(rank, 3); reasons.push({ key: 'sev_households_high', params: { count: households } }); }
  else if (households > 0) { reasons.push({ key: 'sev_households_info', params: { count: households } }); }

  // Rule 3 — anything health-related is critical, always (drinking water).
  if (preset?.boilNotice || input.boilNotice) {
    rank = 4;
    reasons.push({ key: 'sev_health', params: {} });
  }

  // Rule 4 — long outages escalate.
  const eta = Number(input.etaMinutes || preset?.etaMinutes || 0);
  if (eta >= 360) { rank = Math.max(rank, 3); reasons.push({ key: 'sev_duration', params: { hours: Math.round(eta / 60) } }); }

  // Rule 5 — planned work is communicated calmly, never above "medium".
  if (preset?.planned || input.planned) { rank = Math.min(rank, 2); reasons.push({ key: 'sev_planned', params: {} }); }

  // Rule 6 — hospitals, care homes and similar.
  if (input.criticalInfrastructure) { rank = 4; reasons.push({ key: 'sev_infrastructure', params: {} }); }

  return {
    severity: Object.values(SEVERITIES).find((s) => s.rank === rank).id,
    reasons
  };
}
