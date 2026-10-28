/**
 * mongodb.js - MongoDB connection and models
 *
 * Replaces JSON file storage with MongoDB for production-ready persistence.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import createAESPlugin from "mongoose-aes-encryption";

// MongoDB connection string from config
let connectionPromise = null;

export function connectMongo(connectionString) {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log("[stadtwerke] MongoDB connected");
    })
    .catch((error) => {
      console.error("[stadtwerke] MongoDB connection failed:", error.message);
      throw error;
    });

  return connectionPromise;
}

export function disconnectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.disconnect();
  }
  return Promise.resolve();
}

// Mongoose schemas for each collection
const incidentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    service: { type: String, required: true },
    presetId: { type: String, required: true },
    districts: [{ type: String }],
    startedAt: { type: String, required: true },
    etaAt: { type: String },
    capturedAt: { type: String, required: true },
    etaMinutes: Number,
    coords: {
      lat: Number,
      lng: Number,
    },
    radiusMeters: Number,
    boilNotice: { type: Boolean, default: false },
    planned: { type: Boolean, default: false },
    reportedBy: {
      id: String,
      name: String,
    },
    status: { type: String, default: "active" },
    text: String,
    variant: { type: Number, default: 0 },
    street: String,
    lat: Number,
    lng: Number,
    radius: Number,
    note: String,
    toneOverride: String,
    source: { type: String, default: "preset" },
    publishedAt: String,
    resolvedAt: String,
    updateCount: { type: Number, default: 0 },
    severity: String,
    critical: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const draftSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    incidentId: { type: String, required: true },
    kind: { type: String, required: true },
    status: { type: String, default: "draft" },
    createdAt: { type: String, required: true },
    publishedAt: String,
    approvedAt: String,
    approvedBy: String,
    sentBy: {
      id: String,
      name: String,
    },
    messages: {
      de: mongoose.Schema.Types.Mixed,
      en: mongoose.Schema.Types.Mixed,
      fr: mongoose.Schema.Types.Mixed,
      es: mongoose.Schema.Types.Mixed,
    },
    checks: Array,
    allOk: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    auto: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const publicationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    incidentId: { type: String, required: true },
    draftId: { type: String, required: true },
    kind: String,
    at: { type: String, required: true },
    measure: String,
    measuredFrom: String,
    auto: { type: Boolean, default: false },
    messages: mongoose.Schema.Types.Mixed,
    html: String,
    results: Array,
    okCount: Number,
    totalCount: Number,
    kpiSeconds: Number,
  },
  { timestamps: true }
);

const outboxSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    channel: String,
    payload: mongoose.Schema.Types.Mixed,
    attempts: { type: Number, default: 0 },
    lastAttempt: String,
    nextAttempt: String,
  },
  { timestamps: true }
);

const pushSubSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  { timestamps: true }
);

const metaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const customDistrictSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    households: { type: Number, default: 0 },
    custom: { type: Boolean, default: true },
    center: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

const customPresetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    service: String,
    name: {
      de: String,
      en: String,
      fr: String,
      es: String,
    },
    cause: {
      de: String,
      en: String,
      fr: String,
      es: String,
    },
    icon: String,
    tone: { type: String, default: "steady" },
    etaMinutes: { type: Number, default: 120 },
    planned: { type: Boolean, default: false },
    boilNotice: { type: Boolean, default: false },
    custom: { type: Boolean, default: true },
    critical: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const customServiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: {
      de: String,
      en: String,
      fr: String,
      es: String,
    },
    icon: String,
    custom: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    pin: { type: String, required: true }, // Stored as bcrypt hash

    // These fields will be encrypted by the AES plugin
    email: { type: String, encrypted: true },
    phone: { type: String, encrypted: true },
    department: { type: String, encrypted: true },

    avatar: String,
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    role: { type: String, default: "worker" },
    preferences: {
      language: { type: String, default: "de" },
      theme: { type: String, default: "light" },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// 1. Pre-save hook to hash the PIN automatically
userSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 2. Apply AES Encryption plugin for PII fields
// We pass a fallback key if ENCRYPTION_KEY is missing to prevent crashes during dev
const encryptionKey =
  process.env.ENCRYPTION_KEY || "12345678901234567890123456789012";
const aesPlugin = createAESPlugin({ key: encryptionKey });
userSchema.plugin(aesPlugin);

// Create models
export const Incident = mongoose.model("Incident", incidentSchema);
export const Draft = mongoose.model("Draft", draftSchema);
export const Publication = mongoose.model("Publication", publicationSchema);
export const Outbox = mongoose.model("Outbox", outboxSchema);
export const PushSub = mongoose.model("PushSub", pushSubSchema);
export const Meta = mongoose.model("Meta", metaSchema);
export const CustomDistrict = mongoose.model(
  "CustomDistrict",
  customDistrictSchema
);
export const CustomPreset = mongoose.model("CustomPreset", customPresetSchema);
export const CustomService = mongoose.model(
  "CustomService",
  customServiceSchema
);
export const User = mongoose.model("User", userSchema);
