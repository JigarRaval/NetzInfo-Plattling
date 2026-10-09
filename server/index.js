/**
 * index.js — the Express application.
 *
 * One process serves the JSON API, the machine-readable outputs and the built
 * frontend, so the whole system runs from a single command and a single port.
 */

import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { config, envFileLoaded } from "./config.js";
import { api, rssHandler, widgetHandler } from "./routes/api.js";
import { startScheduler } from "./core/scheduler.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "1mb" }));

/**
 * CORS and a few baseline headers.
 *
 * In development the app is opened from a phone on the same Wi-Fi and from
 * the Vite dev server on another port, so any origin is allowed. In
 * production set ALLOWED_ORIGINS to the real address - a wide-open API plus
 * a bearer token is an unnecessary invitation.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (allowedOrigins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  // X-Frame-Options is deliberately NOT set: the city widget is meant to be
  // embedded in an iframe on the municipal website.
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/api", api);
app.get("/feed.xml", rssHandler); // RSS 2.0 for readers and aggregators
app.get("/widget", widgetHandler); // standalone HTML for an <iframe>

// Serve the built frontend if it exists (npm run build in client/).
const dist = path.join(here, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|feed\.xml|widget).*/, (req, res) =>
    res.sendFile(path.join(dist, "index.html"))
  );
}

// Automatic status updates for outages that run long.
startScheduler();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[netzinfo] ready on http://0.0.0.0:${config.port}`);
  // Make the two settings that silently break a demo visible at startup.
  const hi = config.heimatInfo;
  console.log(
    `[netzinfo] settings: ${
      envFileLoaded ? "server/.env loaded" : "no server/.env, using defaults"
    }`
  );
  console.log(
    `[netzinfo] Heimat-Info: ${
      hi.organizationId ? "configured" : "NO CREDENTIALS"
    }` +
      ` · posts are created as "${hi.status}"` +
      `${
        hi.status === "Draft"
          ? "  <-- Draft posts are NOT visible publicly"
          : ""
      }`
  );
  console.log(`[netzinfo] data: ${config.dataFile}`);

  // Without a WORKERS setting the pins are random, so they have to be shown
  // once - otherwise nobody could sign in on a fresh checkout.
  if (config.auth.enabled && !process.env.WORKERS) {
    console.log(
      "[netzinfo] WARNING: no WORKERS configured, using temporary accounts:"
    );
    for (const worker of config.auth.workers) {
      console.log(`[netzinfo]   ${worker.name.padEnd(16)} PIN ${worker.pin}`);
    }
    console.log("[netzinfo] Set WORKERS in server/.env before any real use.");
  }
});
