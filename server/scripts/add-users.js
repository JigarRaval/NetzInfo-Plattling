/**
 * add-users.js - Add users to MongoDB
 *
 * This script adds new users to the MongoDB database.
 * Run with: node scripts/add-users.js
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

async function addUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    // Users to add
    const usersToAdd = [
      {
        workerId: "swp-05",
        name: "Thomas Müller",
        pin: "246810",
        email: "",
        phone: "",
        department: "",
        isActive: true,
        role: "worker",
        preferences: {
          language: "de",
          theme: "light",
          notifications: true,
        },
      },
      {
        workerId: "swp-06",
        name: "Lisa Schmidt",
        pin: "579318",
        email: "",
        phone: "",
        department: "",
        isActive: true,
        role: "worker",
        preferences: {
          language: "de",
          theme: "light",
          notifications: true,
        },
      },
    ];

    // Add users
    for (const userData of usersToAdd) {
      const existing = await User.findOne({ workerId: userData.workerId });
      if (existing) {
        console.log(`User ${userData.workerId} already exists, updating PIN...`);
        // Update the PIN to match
        await User.findOneAndUpdate(
          { workerId: userData.workerId },
          { $set: { pin: userData.pin } }
        );
        console.log(`✓ Updated PIN for: ${userData.name} (${userData.workerId})`);
      } else {
        const user = await User.create(userData);
        console.log(`✓ Created user: ${userData.name} (${userData.workerId})`);
      }
    }

    console.log("\n✓ All users added successfully!");
    console.log("\nCredentials:");
    console.log("--------------------------------------------------");
    usersToAdd.forEach(u => {
      console.log(`Username: ${u.workerId}`);
      console.log(`Name: ${u.name}`);
      console.log(`PIN: ${u.pin}`);
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("Error adding users:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

addUsers();
