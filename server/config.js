/**
 * config.js - every tunable value of the backend in one place.
 *
 * HEIMAT-INFO CREDENTIALS, THE LOGIN PIN AND THE AUTOMATIC UPDATES ARE SET HERE.
 * Everything can also come from environment variables (server/.env), which is
 * safer because that file is ignored by Git.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Without a WORKERS setting, four demo accounts are created with RANDOM pins
 * that are printed once at start-up.
 *
 * Fixed default pins must never live in the source code: the moment the
 * repository is public, so are the credentials of every installation that
 * never changed them.
 */
function developmentWorkers() {
  const names = ["Anna Huber", "Max Bauer", "Sabine Reiter", "Josef Wimmer"];
  return names.map((name, index) => ({
    id: `swp-0${index + 1}`,
    name,
    pin: String(Math.floor(1000 + Math.random() * 9000)),
  }));
}

/**
 * Read WORKERS="id:Name:pin;id:Name:pin" into a list.
 *
 * Every person has their OWN pin. A shared team pin plus a name chosen from
 * a dropdown would let anybody report under somebody else's name, which is
 * worse than no name at all, because it looks trustworthy.
 */
function parseWorkers(raw) {
  if (!raw) return null;
  const list = raw
    .split(";")
    .map((entry) => {
      const parts = entry.split(":").map((x) => x.trim());
      const [id, name, pin] = parts;
      return { id, name, pin };
    })
    .filter((w) => w.id && w.name && w.pin);
  return list.length ? list : null;
}

/**
 * Read server/.env if it exists.
 *
 * Node does NOT do this by itself, so without these few lines every value in
 * the .env file is silently ignored and the defaults below are used instead -
 * which looks exactly like "my API key does not work". No dependency is
 * needed for something this small.
 *
 * Rules: lines starting with # are comments, empty values mean "use the
 * default", and a real environment variable always beats the file.
 */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return false;

  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue; // comment or blank line

    const key = match[1];
    let value = match[2].trim();
    // allow quoted values, e.g. KEY="a b c"
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "") continue; // empty means: keep the default
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

export const envFileLoaded = loadEnvFile(path.join(here, ".env"));

export const config = {
  port: Number(process.env.PORT || 4000),

  // One JSON file is the whole database: no install, works offline.
  dataFile: process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : path.join(here, "data", "db.json"),

  // --- Heimat-Info ---------------------------------------------------------
  heimatInfo: {
    baseUrl:
      process.env.HEIMATINFO_BASE_URL ||
      "https://heimatinfo-api-platform-dev.azurewebsites.net",

    // ----------------------------------------------------------------
    // PASTE YOUR CREDENTIALS HERE
    organizationId: process.env.HEIMATINFO_ORG_ID || "",
    apiKey: process.env.HEIMATINFO_API_KEY || "",
    // ----------------------------------------------------------------

    // 'Draft'     = the post is created but stays INVISIBLE on the public page
    // 'Published' = the post appears on the Plattling page straight away
    //
    // Use Draft while testing the connection, Published as soon as the
    // messages should actually reach citizens. This is the single reason a
    // post can be "sent successfully" and still not show up anywhere.
    status: process.env.HEIMATINFO_STATUS || "Published",
  },

  // --- Who may send messages ----------------------------------------------
  // A short PIN is the right level of protection for a device that is used
  // with gloves in the field. Set AUTH_PIN in the environment to change it.
  auth: {
    enabled: process.env.AUTH_DISABLED !== "true",
    teamName: process.env.AUTH_TEAM || "Stadtwerke Plattling",
    sessionHours: 12,

    /**
     * Who is on shift. The PIN proves that somebody belongs to the team; the
     * name says who it was, which is what ends up in the record of a report.
     *
     * Set them with WORKERS="swp-01:Anna Huber;swp-02:Max Bauer" or edit the
     * list here. Keep the ids stable - they are stored with every incident.
     */
    workers: parseWorkers(process.env.WORKERS) || developmentWorkers(),

    // Brute force protection: a four digit pin is only 10,000 guesses.
    maxAttempts: Number(process.env.AUTH_MAX_ATTEMPTS || 5),
    lockMinutes: Number(process.env.AUTH_LOCK_MINUTES || 10),
  },

  /**
   * Turning coordinates into a street name uses the public OpenStreetMap
   * service. It is optional: without internet the report simply keeps the
   * coordinates and the district, which is already enough to act on.
   */
  geocoding: {
    enabled: process.env.GEOCODING_DISABLED !== "true",
    url:
      process.env.GEOCODING_URL ||
      "https://nominatim.openstreetmap.org/reverse",
    // Nominatim asks every application to identify itself.
    userAgent:
      process.env.GEOCODING_AGENT ||
      "Stadtwerke-Plattling/1.0 (municipal outage tool)",
  },

  // --- Automatic updates for long outages ---------------------------------
  // If an outage is still running, citizens get a short status message every
  // N minutes without anybody having to remember it.
  autoUpdate: {
    enabled: process.env.AUTO_UPDATE_DISABLED !== "true",
    everyMinutes: Number(process.env.AUTO_UPDATE_MINUTES || 30),
    maxPerIncident: 8, // stop eventually, never spam
    extendByMinutes: 30, // push the estimate back when it has expired
  },

  // Optional extra REST target that receives every publication as JSON.
  webhookUrl: process.env.WEBHOOK_URL || "",
};
