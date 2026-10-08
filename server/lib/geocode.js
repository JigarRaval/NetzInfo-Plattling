/**
 * geocode.js - turns coordinates into a street and a town.
 *
 * Done on the server, not in the browser, for three reasons: the public
 * OpenStreetMap service asks every application to identify itself with a
 * User-Agent, which a browser cannot set; results can be cached for everyone
 * instead of per device; and it keeps the citizens' map provider out of the
 * staff device entirely.
 *
 * It is strictly optional. Without internet the report keeps the coordinates
 * and the chosen districts, which is already enough for a crew to drive out.
 */

import { config } from "../config.js";

// Coordinates repeat a lot during one incident, so a tiny cache avoids
// hammering a free service. Rounded to ~11 m, which is finer than GPS.
const cache = new Map();
const key = (lat, lng) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

/**
 * @returns {Promise<null | { street, houseNumber, postcode, city, label }>}
 */
export async function reverseGeocode(lat, lng) {
  if (!config.geocoding.enabled) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cacheKey = key(lat, lng);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url =
    `${config.geocoding.url}?format=jsonv2&lat=${lat}&lon=${lng}` +
    "&zoom=18&addressdetails=1&accept-language=de";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": config.geocoding.userAgent,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const a = data.address || {};

    const street = a.road || a.pedestrian || a.footway || a.neighbourhood || "";
    const houseNumber = a.house_number || "";
    const city = a.city || a.town || a.village || a.municipality || "";
    const postcode = a.postcode || "";

    // What a person would write down: "Bahnhofstraße 12, 94447 Plattling"
    const label =
      [
        [street, houseNumber].filter(Boolean).join(" "),
        [postcode, city].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ") ||
      data.display_name ||
      "";

    const result = { street, houseNumber, postcode, city, label };
    cache.set(cacheKey, result);
    return result;
  } catch {
    return null; // offline, slow or rate-limited: not an error
  }
}
