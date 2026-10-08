/**
 * store.js — a tiny JSON-file database.
 *
 * The only file that knows how data is persisted. Replacing it with MongoDB
 * means re-implementing these six functions and nothing else.
 */

import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const EMPTY = {
  incidents: [],
  drafts: [],
  publications: [],
  outbox: [],
  pushSubs: [],
  meta: {},
  customDistricts: [],
  customPresets: [],
  customServices: [],
};

let db = null;

function load() {
  if (db) return db;
  try {
    db = {
      ...structuredClone(EMPTY),
      ...JSON.parse(fs.readFileSync(config.dataFile, "utf8")),
    };
  } catch {
    db = structuredClone(EMPTY);
  }
  return db;
}

/** Atomic write: temp file + rename, so a crash cannot corrupt the database. */
function persist() {
  fs.mkdirSync(path.dirname(config.dataFile), { recursive: true });
  const tmp = `${config.dataFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, config.dataFile);
}

export function all() {
  return load();
}

export function insert(collection, doc) {
  load()[collection].push(doc);
  persist();
  return doc;
}

export function findById(collection, id) {
  return load()[collection].find((d) => d.id === id) || null;
}

/** Patch a document; `patch` is an object to merge or a function to apply. */
export function update(collection, id, patch) {
  const doc = findById(collection, id);
  if (!doc) return null;
  if (typeof patch === "function") patch(doc);
  else Object.assign(doc, patch);
  persist();
  return doc;
}

export function replace(collection, rows) {
  load()[collection] = rows;
  persist();
}

/** Small key/value area for things that are not documents (e.g. push keys). */
export function saveMeta(patch) {
  load().meta = { ...(load().meta || {}), ...patch };
  persist();
  return load().meta;
}

/** Store a push subscription once per endpoint. */
export function addPushSubscription(subscription) {
  const list = load().pushSubs;
  if (!list.some((s) => s.endpoint === subscription.endpoint)) {
    list.push(subscription);
    persist();
  }
  return list.length;
}
