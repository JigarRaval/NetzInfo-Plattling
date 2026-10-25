/**
 * store-mongo.js - MongoDB-based data store
 *
 * Implements the same interface as store.js but uses MongoDB for persistence.
 * All functions are compatible with the existing codebase.
 */

import {
  Incident,
  Draft,
  Publication,
  Outbox,
  PushSub,
  Meta,
  CustomDistrict,
  CustomPreset,
  CustomService,
  User,
} from "./mongodb.js";

const COLLECTION_MAP = {
  incidents: Incident,
  drafts: Draft,
  publications: Publication,
  outbox: Outbox,
  pushSubs: PushSub,
  meta: Meta,
  customDistricts: CustomDistrict,
  customPresets: CustomPreset,
  customServices: CustomService,
  users: User,
};

/** Load all data from MongoDB (for compatibility with all() function) */
export async function all() {
  const result = {
    incidents: [],
    drafts: [],
    publications: [],
    outbox: [],
    pushSubs: [],
    meta: {},
    customDistricts: [],
    customPresets: [],
    customServices: [],
    users: [],
  };

  // Fetch all collections in parallel
  const [incidents, drafts, publications, outbox, pushSubs, customDistricts, customPresets, customServices, users] = await Promise.all([
    Incident.find({}).lean(),
    Draft.find({}).lean(),
    Publication.find({}).lean(),
    Outbox.find({}).lean(),
    PushSub.find({}).lean(),
    CustomDistrict.find({}).lean(),
    CustomPreset.find({}).lean(),
    CustomService.find({}).lean(),
    User.find({}).lean(),
  ]);

  result.incidents = incidents;
  result.drafts = drafts;
  result.publications = publications;
  result.outbox = outbox;
  result.pushSubs = pushSubs;
  result.customDistricts = customDistricts;
  result.customPresets = customPresets;
  result.customServices = customServices;
  result.users = users;

  // Load meta as key-value object
  const metaEntries = await Meta.find({}).lean();
  result.meta = metaEntries.reduce((acc, m) => {
    acc[m.key] = m.value;
    return acc;
  }, {});

  return result;
}

/** Insert a document into a collection */
export async function insert(collection, doc) {
  const Model = COLLECTION_MAP[collection];
  if (!Model) throw new Error(`Unknown collection: ${collection}`);

  const created = await Model.create(doc);
  return created.toObject();
}

/** Find a document by ID */
export async function findById(collection, id) {
  const Model = COLLECTION_MAP[collection];
  if (!Model) throw new Error(`Unknown collection: ${collection}`);

  const doc = await Model.findOne({ id }).lean();
  return doc || null;
}

/** Update a document by ID */
export async function update(collection, id, patch) {
  const Model = COLLECTION_MAP[collection];
  if (!Model) throw new Error(`Unknown collection: ${collection}`);

  const doc = await Model.findOne({ id });
  if (!doc) return null;

  if (typeof patch === "function") {
    const docObj = doc.toObject();
    patch(docObj);
    await Model.updateOne({ id }, docObj);
    return docObj;
  } else {
    const updated = await Model.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true }
    ).lean();
    return updated;
  }
}

/** Replace all documents in a collection */
export async function replace(collection, rows) {
  const Model = COLLECTION_MAP[collection];
  if (!Model) throw new Error(`Unknown collection: ${collection}`);

  await Model.deleteMany({});
  if (rows.length > 0) {
    await Model.insertMany(rows);
  }
}

/** Save meta key-value pair */
export async function saveMeta(patch) {
  const entries = Object.entries(patch);
  for (const [key, value] of entries) {
    await Meta.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
  }

  const metaEntries = await Meta.find({}).lean();
  return metaEntries.reduce((acc, m) => {
    acc[m.key] = m.value;
    return acc;
  }, {});
}

/** Store a push subscription once per endpoint */
export async function addPushSubscription(subscription) {
  const existing = await PushSub.findOne({ endpoint: subscription.endpoint });
  if (!existing) {
    await PushSub.create(subscription);
  }

  const count = await PushSub.countDocuments();
  return count;
}
