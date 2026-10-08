/**
 * heimatinfo.js — the real Heimat-Info REST client.
 *
 * Implements exactly what the organizers described:
 *   GET  {base}/External/organizations                        list my organizations
 *   POST {base}/External/organizations/{organizationId}/posts create a post
 *   header  X-Api-Key: <key>
 *   status  "Draft" by default, so nothing becomes public by accident
 *
 * Results are reported as translation keys so the interface can show them in
 * the user's language.
 */

import { config } from "../config.js";

/**
 * The credentials come from server/config.js (or the matching environment
 * variables). There is no runtime configuration screen any more: the
 * Organization ID and the API key are part of the deployment.
 */
export function heimatConfig() {
  return {
    baseUrl: config.heimatInfo.baseUrl.replace(/\/+$/, ""),
    organizationId: config.heimatInfo.organizationId,
    apiKey: config.heimatInfo.apiKey,
    status: config.heimatInfo.status,
  };
}

/** Shared request helper: key header, timeout, uniform error shape. */
async function call(
  path,
  { method = "GET", body, baseUrl, apiKey, timeoutMs = 12000 }
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    return {
      ok: res.ok,
      httpStatus: res.status,
      data,
      ms: Date.now() - startedAt,
      // The platform's own wording is kept: it is diagnostic output, shown verbatim.
      detail: res.ok
        ? ""
        : data?.Message || data?.message || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      data: null,
      ms: Date.now() - startedAt,
      detail: err.name === "AbortError" ? "Timeout" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Connection test: lists the organizations the key may write to, so the team
 * can verify the key AND copy the correct organization id in one step.
 */
export async function testConnection(overrides = {}) {
  const clean = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v)
  );
  const c = { ...heimatConfig(), ...clean };

  if (!c.apiKey)
    return { ok: false, resultKey: "con_result_no_key", detail: "" };

  const res = await call("/External/organizations", {
    baseUrl: c.baseUrl,
    apiKey: c.apiKey,
  });

  if (res.ok) {
    const orgs = Array.isArray(res.data) ? res.data : [];
    return {
      ok: true,
      resultKey: "con_result_connected",
      params: { count: orgs.length, ms: res.ms },
      organizations: orgs.map((o) => ({ id: o.id, name: o.name })),
    };
  }

  // The platform distinguishes "no key" from "wrong key" — pass that through.
  const resultKey =
    res.httpStatus === 401
      ? /not provided/i.test(res.detail)
        ? "con_result_no_key"
        : "con_result_invalid_key"
      : "con_result_error";
  return {
    ok: false,
    resultKey,
    detail: res.detail,
    params: { status: res.httpStatus },
  };
}

/** Create one post. Returns a channel-style result (keys, not sentences). */
export async function publishPost({
  title,
  htmlContent,
  externalId,
  statusOverride,
}) {
  const c = heimatConfig();

  // No credentials -> skip without failing the rest of the fan-out.
  if (!c.organizationId || !c.apiKey) {
    return {
      ok: false,
      skipped: true,
      messageKey: "ch_msg_hi_not_configured",
      params: {},
    };
  }

  const payload = {
    title: String(title).slice(0, 200),
    htmlContent, // only h3/p — script and iframe are rejected
    status: statusOverride || c.status, // "Draft" unless deliberately changed
    externalId, // our incident id keeps the post traceable
  };

  const res = await call(`/External/organizations/${c.organizationId}/posts`, {
    method: "POST",
    body: payload,
    baseUrl: c.baseUrl,
    apiKey: c.apiKey,
  });

  return {
    ok: res.ok,
    skipped: false,
    messageKey: res.ok ? "ch_msg_hi_created" : "ch_msg_hi_failed",
    params: { status: payload.status, ms: res.ms, detail: res.detail },
    postId: res.data?.id || null,
    ms: res.ms,
  };
}
