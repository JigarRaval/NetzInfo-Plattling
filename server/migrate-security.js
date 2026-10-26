import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, connectMongo } from "./lib/mongodb.js"; // Adjust path if needed

dotenv.config();

async function migrate() {
  await connectMongo(process.env.MONGODB_URI);
  const users = await User.find({});
  for (const user of users) {
    // Flag pin as modified so the hook runs
    user.pin = user.pin;
    user.markModified("pin");
    // Flag encryption fields as modified
    user.markModified("email");
    user.markModified("phone");
    user.markModified("department");
    await user.save();
    console.log(`Secured user: ${user.workerId}`);
  }
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
