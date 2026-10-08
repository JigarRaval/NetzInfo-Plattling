/**
 * clock.js — ONE timer for the whole application.
 *
 * Several components show live durations. Giving each its own setInterval was
 * the cause of the stutter in the earlier version, so a single interval ticks
 * once per second and every subscriber re-renders from the same value.
 */

import { useEffect, useState } from 'react';

const subscribers = new Set();
let handle = null;

function subscribe(fn) {
  subscribers.add(fn);
  if (!handle) handle = setInterval(() => { const now = Date.now(); subscribers.forEach((s) => s(now)); }, 1000);
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) { clearInterval(handle); handle = null; }
  };
}

/** Re-renders the calling component once per second. */
export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => subscribe(setNow), []);
  return now;
}

/** Seconds as M:SS — the KPI stopwatch format. */
export function duration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds elapsed since an ISO timestamp, measured against the shared clock. */
export function secondsSince(iso, now) {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
}
