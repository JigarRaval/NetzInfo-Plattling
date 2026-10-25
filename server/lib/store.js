/**
 * store.js — data store abstraction layer
 *
 * Switches between JSON file storage and MongoDB based on configuration.
 * For MongoDB, all functions are async. For JSON, they are synchronous but wrapped in promises.
 */

import { config } from "../config.js";

let storeImpl = null;
let isMongo = false;
let initPromise = null;

async function initStore() {
  if (storeImpl) return;

  if (config.mongoUri) {
    // Use MongoDB
    const { connectMongo } = await import("./mongodb.js");
    const {
      all,
      insert,
      findById,
      update,
      replace,
      saveMeta,
      addPushSubscription,
    } = await import("./store-mongo.js");

    // Connect to MongoDB
    await connectMongo(config.mongoUri);

    storeImpl = {
      all,
      insert,
      findById,
      update,
      replace,
      saveMeta,
      addPushSubscription,
    };
    isMongo = true;
  } else {
    // Use JSON file storage (wrap in promises for consistency)
    const jsonStore = await import("./store-json.js");
    storeImpl = {
      all: () => Promise.resolve(jsonStore.all()),
      insert: (c, d) => Promise.resolve(jsonStore.insert(c, d)),
      findById: (c, id) => Promise.resolve(jsonStore.findById(c, id)),
      update: (c, id, p) => Promise.resolve(jsonStore.update(c, id, p)),
      replace: (c, r) => Promise.resolve(jsonStore.replace(c, r)),
      saveMeta: (p) => Promise.resolve(jsonStore.saveMeta(p)),
      addPushSubscription: (s) => Promise.resolve(jsonStore.addPushSubscription(s)),
    };
    isMongo = false;
  }
}

export async function initializeStore() {
  if (!initPromise) {
    initPromise = initStore();
  }
  await initPromise;
}

async function getStore() {
  if (!storeImpl) {
    if (!initPromise) {
      initPromise = initStore();
    }
    await initPromise;
  }
  return storeImpl;
}

export function useMongo() {
  return isMongo;
}

export async function all() {
  return (await getStore()).all();
}

export async function insert(collection, doc) {
  return (await getStore()).insert(collection, doc);
}

export async function findById(collection, id) {
  return (await getStore()).findById(collection, id);
}

export async function update(collection, id, patch) {
  return (await getStore()).update(collection, id, patch);
}

export async function replace(collection, rows) {
  return (await getStore()).replace(collection, rows);
}

export async function saveMeta(patch) {
  return (await getStore()).saveMeta(patch);
}

export async function addPushSubscription(subscription) {
  return (await getStore()).addPushSubscription(subscription);
}
