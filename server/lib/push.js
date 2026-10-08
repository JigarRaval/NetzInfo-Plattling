/**
 * push.js - real browser push notifications.
 *
 * Citizens (or staff on a second device) can subscribe in the browser; every
 * published message is then delivered as a system notification, even when the
 * page is closed. This uses the Web Push standard with VAPID keys, which are
 * generated once on the first start and kept in the database.
 *
 * The whole module degrades quietly: if the optional web-push package is not
 * installed, subscriptions are still accepted and the channel reports that
 * delivery is unavailable instead of crashing the fan-out.
 */

import { all, saveMeta } from "./store.js";

let webpush = null;
try {
  // Optional dependency - the application runs fine without it.
  webpush = (await import("web-push")).default;
} catch {
  webpush = null;
}

/** Create the VAPID key pair once and remember it. */
function keys() {
  if (!webpush) return null;
  const meta = all().meta || {};
  if (meta.vapidPublic && meta.vapidPrivate) {
    return { publicKey: meta.vapidPublic, privateKey: meta.vapidPrivate };
  }
  const generated = webpush.generateVAPIDKeys();
  saveMeta({
    vapidPublic: generated.publicKey,
    vapidPrivate: generated.privateKey,
  });
  return generated;
}

/** The public key the browser needs in order to subscribe. */
export function publicKey() {
  const pair = keys();
  return pair ? pair.publicKey : null;
}

export function available() {
  return Boolean(webpush);
}

/** Send one notification to every stored subscription. */
export async function sendToAll({ title, body, url = "/" }) {
  const subscriptions = all().pushSubs || [];
  if (!webpush || subscriptions.length === 0) {
    return {
      delivered: 0,
      total: subscriptions.length,
      available: Boolean(webpush),
    };
  }

  const pair = keys();
  webpush.setVapidDetails(
    "mailto:info@stadtwerke-plattling.de",
    pair.publicKey,
    pair.privateKey
  );

  const payload = JSON.stringify({ title, body, url });
  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        return true;
      } catch {
        return false; // expired subscriptions simply fail
      }
    })
  );

  return {
    delivered: results.filter(Boolean).length,
    total: subscriptions.length,
    available: true,
  };
}
