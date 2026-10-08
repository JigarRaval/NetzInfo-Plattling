/**
 * heimat-posts.mjs - list and bulk delete the posts this app created in
 * Heimat-Info.
 *
 * Testing leaves a lot of posts behind. Deleting them one by one in the web
 * interface is tedious, so this does it over the same REST API we publish
 * with.
 *
 * Safety: it never deletes anything unless you say so, and by default it
 * only touches posts that carry OUR externalId (INC-... or TEST-...), so a
 * post somebody else wrote in the same organization is left alone.
 *
 *   node scripts/heimat-posts.mjs list              show what is there
 *   node scripts/heimat-posts.mjs delete            delete OUR posts (asks first)
 *   node scripts/heimat-posts.mjs delete --yes      delete OUR posts, no question
 *   node scripts/heimat-posts.mjs delete --all --yes  delete EVERY post
 *
 * Credentials come from server/.env or from the environment.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/* ------------------------------------------------------------- settings */
function loadEnv() {
  const file = path.join(ROOT, "server", ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value && process.env[match[1]] === undefined)
      process.env[match[1]] = value;
  }
}
loadEnv();

const BASE = (
  process.env.HEIMATINFO_BASE_URL ||
  "https://heimatinfo-api-platform-dev.azurewebsites.net"
).replace(/\/+$/, "");
const ORG = process.env.HEIMATINFO_ORG_ID || "";
const KEY = process.env.HEIMATINFO_API_KEY || "";

if (!ORG || !KEY) {
  console.error(
    "No credentials. Put HEIMATINFO_ORG_ID and HEIMATINFO_API_KEY into server/.env"
  );
  process.exit(1);
}

const headers = { "X-Api-Key": KEY, Accept: "application/json" };

/* ------------------------------------------------------------- the API */
/** Note the singular "organization" on this one - that is how it is defined. */
async function listPosts() {
  const res = await fetch(`${BASE}/External/organization/${ORG}/posts`, {
    headers,
  });
  if (!res.ok)
    throw new Error(`list failed: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.items || data.posts || [];
}

async function deletePost(id) {
  const res = await fetch(`${BASE}/External/organizations/${ORG}/posts/${id}`, {
    method: "DELETE",
    headers,
  });
  return res.ok;
}

/** Did this application create the post? */
const isOurs = (post) => /^(INC|TEST)-/i.test(String(post.externalId || ""));

function describe(post, index) {
  const when = post.createdAt || post.created || post.publishedAt || "";
  return (
    `${String(index + 1).padStart(3)}. ${post.status || "?"}  ${String(
      post.title || ""
    ).slice(0, 58)}` +
    `  ${isOurs(post) ? "[ours]" : "[other]"}${
      when ? "  " + String(when).slice(0, 16) : ""
    }`
  );
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

/* ---------------------------------------------------------------- main */
const command = process.argv[2] || "list";
const all = process.argv.includes("--all");
const yes = process.argv.includes("--yes");

const posts = await listPosts();
console.log(`\n${posts.length} post(s) in organization ${ORG}\n`);
posts.forEach((post, index) => console.log(describe(post, index)));

if (command !== "delete") {
  console.log('\nNothing deleted. Use "delete" to remove them.\n');
  process.exit(0);
}

const targets = all ? posts : posts.filter(isOurs);
if (targets.length === 0) {
  console.log("\nNothing to delete.\n");
  process.exit(0);
}

console.log(
  `\nAbout to delete ${targets.length} post(s)${
    all
      ? " - EVERY post, including ones this app did not create"
      : " created by this app"
  }.`
);

if (!yes) {
  const answer = await ask('Type "delete" to confirm: ');
  if (answer.trim().toLowerCase() !== "delete") {
    console.log("Cancelled.\n");
    process.exit(0);
  }
}

let removed = 0;
for (const post of targets) {
  const ok = await deletePost(post.id);
  if (ok) removed += 1;
  process.stdout.write(ok ? "." : "x");
  // Be polite to a shared development system.
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`\n\n${removed} of ${targets.length} deleted.\n`);
