# ⚡ NetzInfo Plattling

**Intelligent outage communication for Stadtwerke Plattling**
Innovation Challenge 2026 · Smart Region Niederbayern · Use Case #9 · THD

> From "something broke" to citizens informed on every channel — **in under 3 minutes**,
> with a human approval in the middle and no AI required.

---

## Run it

```bash
npm run setup     # installs server and client dependencies
npm run build     # builds the web app
npm start         # one process serves API + app on http://localhost:4000
```

Development with hot reload (two terminals):

```bash
npm run dev:api   # API on :4000
npm run dev:web   # UI on :5173, proxies /api to :4000
```

Quality guard (run it any time, it gates the UI against regressions):

```bash
npm run check
```

```
1. Translation completeness   ✓ 227 keys × 4 languages complete
2. Keys used in the interface ✓ all 168 used keys are defined
3. Hardcoded text             ✓ no hardcoded German found in components
4. CSS classes                ✓ all 76 CSS classes are defined
```

---

## What it does

| Step | Screen | What happens |
|---|---|---|
| 1 Report | **Erfassen / Report** | Tap a preset, tap a district. Optional: duration, dictation, GPS, critical-infrastructure flag. |
| 2 Structure | *(server)* | Rules compute severity and return the reason for every rule that fired. Duplicates are detected and offered as an update. |
| 3 Compose | *(server)* | A six-part message (What / Where / Since / Until / Advice / Contact) in **German, English, French and Spanish** at once. |
| 4 Check | **Freigabe / Approval** | Structure, readability and a **fact check** run automatically. |
| 5 Approve | **Freigabe / Approval** | One human, one button. Nothing publishes without it. |
| 6 Publish | *(server)* | Parallel fan-out to 7 channels with a per-channel log and the KPI time. |
| 7 Inform | **Bürgerseite / Public** | Public page, offline map, grounded question answering. |

**Channels:** status page · RSS 2.0 · city iframe widget · app push · **Heimat-Info REST API (real)** · outbound webhook · editorial system (high/critical only).

---

## Heimat-Info integration

Credentials are handed out on challenge day, so nothing is hard-coded. Open the
**Connect** screen, paste them in, press *Test connection*.

| Aspect | Choice |
|---|---|
| Endpoint | `POST /External/organizations/{organizationId}/posts` — the **organizations** variant, not *communities* |
| Auth | HTTP header `X-Api-Key` |
| Default status | `Draft` — nothing becomes public by accident |
| Payload | `title`, `htmlContent`, `status`, `externalId` (our incident id, for traceability) |
| HTML | only `<h3>` and `<p>` — `script` and `iframe` are rejected by the API |
| No credentials | the channel is skipped and logged; every other channel still publishes |

---

## Architecture

```
Browser — React 18 PWA (installable, offline shell, speech + GPS)
   │  relative /api calls, so the same build runs on localhost, LAN and tunnel
   ▼
Express API (Node 20, ESM)
   ├── data/      master data: utilities, presets, districts, severities
   ├── core/      severity rules · message composition (4 languages) · quality checks · FAQ
   ├── channels/  parallel fan-out · real Heimat-Info client
   ├── routes/    the whole HTTP contract in one readable file
   └── lib/       JSON file store (swap this single file for MongoDB)
```

### The rule that keeps the interface translated

**The server never sends display text.** It sends ids, translation keys and numbers:

```jsonc
// severity reason from the API
{ "key": "sev_households_critical", "params": { "count": 3500 } }
// channel result from the API
{ "channel": "push", "ok": true, "messageKey": "ch_msg_push_created", "params": { "chars": 176 } }
```

`client/src/lib/format.js` turns those into sentences via the dictionary in
`client/src/i18n/strings.js`, where every key carries all four languages side
by side. Message *content* for citizens is composed on the server in all four
languages, because the identical text must reach the RSS feed and the
Heimat-Info post, not only the browser.

---

## File map

| Path | Purpose |
|---|---|
| `server/config.js` | every tunable value, credentials from env or runtime |
| `server/lib/store.js` | JSON-file database — the only persistence code |
| `server/lib/time.js` | ids, ISO timestamps, durations |
| `server/data/catalog.js` | utilities, presets, districts, severities (all 4 languages) |
| `server/core/severity.js` | severity rules → keys + params |
| `server/core/incidents.js` | incident building, duplicate detection |
| `server/core/compose.js` | the six-part message in 4 languages + press release |
| `server/core/quality.js` | structure, readability, fact check |
| `server/core/faq.js` | grounded question answering (whole-word intents) |
| `server/channels/heimatinfo.js` | the real Heimat-Info REST client |
| `server/channels/registry.js` | channel registry + parallel fan-out + RSS |
| `server/routes/api.js` | the complete HTTP contract |
| `server/seed/demo.js` | reproducible demo data (the 1:47 pitch number) |
| `client/src/i18n/strings.js` | 227 interface keys × 4 languages |
| `client/src/i18n/manual.js` | the in-app handbook, 4 languages |
| `client/src/lib/format.js` | keys + ids → translated text |
| `client/src/ui/kit.jsx` | buttons, cards, badges — all merge className with `cx()` |
| `client/src/screens/*.jsx` | Dashboard, Report, Approve, Public, Connect, Manual |
| `client/src/styles.css` | design tokens, light + night theme, 17 px base type |
| `scripts/check-i18n.mjs` | the four-part quality guard |

---

## What runs with nothing installed

No database, no API key, no internet: the JSON store, all internal channels,
all four languages, the quality checks and the FAQ work offline. Only the
Heimat-Info channel needs credentials, and it degrades to a logged skip.

Full handbook: [`docs/MANUAL.md`](docs/MANUAL.md) · Reply to the organizers: [`docs/Reply_to_Organizers.md`](docs/Reply_to_Organizers.md)
