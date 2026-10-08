/**
 * time.js — ids and time helpers.
 *
 * All timestamps are ISO strings; all display formatting happens in the
 * browser, so the server stays free of any language-specific output.
 */

/** Short readable id, e.g. "INC-7F3A2B" — easy to read out over the phone. */
export function makeId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function secondsBetween(startIso, endIso) {
  return Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / 1000));
}

/** Add minutes to an ISO timestamp and return a new ISO timestamp. */
export function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

/**
 * Time of day in the Europe/Berlin zone, used INSIDE generated message texts
 * (e.g. "since 14:35"). This is content, not interface, so it is formatted on
 * the server where the message is composed.
 */
export function localTime(iso, lang = 'de') {
  const time = new Date(iso).toLocaleTimeString(lang === 'de' ? 'de-DE' : lang, {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
  });
  return lang === 'de' ? `${time} Uhr` : time;
}
