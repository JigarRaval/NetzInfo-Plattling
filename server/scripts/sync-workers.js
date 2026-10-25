/**
 * sync-workers.js - Sync workers from config to MongoDB
 *
 * This script reads workers from the WORKERS environment variable or config
 * and adds them to MongoDB. This ensures MongoDB has all the workers.
 * Run with: node scripts/sync-workers.js
 */

import mongoose from "mongoose";
import { config } from "../config.js";

const userSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pin: { type: String, required: true },
  email: String,
  phone: String,
  department: String,
  avatar: String,
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  role: { type: String, default: "worker" },
  preferences: {
    language: { type: String, default: "de" },
    theme: { type: String, default: "light" },
    notifications: { type: Boolean, default: true },
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function syncWorkers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    // Get workers from config
    const workers = config.auth.workers;
    console.log(`Found ${workers.length} workers in config`);

    // Sync each worker to MongoDB
    for (const worker of workers) {
      const existing = await User.findOne({ workerId: worker.id });
      if (existing) {
        console.log(`User ${worker.id} already exists, updating...`);
        await User.findOneAndUpdate(
          { workerId: worker.id },
          { $set: { 
            name: worker.name,
            pin: worker.pin,
            isActive: true,
            role: "worker"
          } }
        );
        console.log(`✓ Updated: ${worker.name} (${worker.id})`);
      } else {
        await User.create({
          workerId: worker.id,
          name: worker.name,
          pin: worker.pin,
          email: "",
          phone: "",
          department: "",
          isActive: true,
          role: "worker",
          lastLogin: new Date(),
          preferences: {
            language: "de",
            theme: "light",
            notifications: true,
          },
        });
        console.log(`✓ Created: ${worker.name} (${worker.id})`);
      }
    }

    console.log("\n✓ All workers synced to MongoDB successfully!");
    console.log("\nTotal users in MongoDB:");
    const count = await User.countDocuments();
    console.log(`Total: ${count}`);

  } catch (error) {
    console.error("Error syncing workers:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

syncWorkers();
