/**
 * reset-production.js - Reset the database to empty production state.
 *
 * This script clears all demo data and prepares the database for production use.
 * Run this before launching the application in production.
 */

import { replace } from "../lib/store.js";

export function resetToProduction() {
  console.log("[reset] Clearing all data for production use...");

  // Clear all collections
  for (const collection of ["incidents", "drafts", "publications", "outbox"]) {
    replace(collection, []);
    console.log(`[reset] Cleared ${collection}`);
  }

  console.log("[reset] Database is now ready for production use.");
  console.log("[reset] Remember to configure WORKERS in server/.env");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetToProduction();
}
