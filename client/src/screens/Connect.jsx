/**
 * Connect.jsx — connect the app to the real Heimat-Info platform.
 *
 * Built for the organizers' setup mail: the Organization ID and the API key
 * are handed out on the day, so they are entered here at runtime instead of
 * living in the source code. The three hints from that mail are implemented
 * and also stated in the interface, so a juror can see them.
 */

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Badge, Button, Card, Field, Item } from "../ui/kit.jsx";
import { channelName } from "../lib/format.js";

const SWAGGER_URL =
  "https://heimatinfo-api-platform-dev.azurewebsites.net/swagger/index.html";
const REVIEW_URL =
  "https://heimatinfo-application-web-platform-dev.azurewebsites.net/gemeinden/plattling";

export default function Connect({ t, catalog, notify, refresh }) {
  const [settings, setSettings] = useState(null);
  const [orgId, setOrgId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Draft");
  const [result, setResult] = useState(null);
  const [outbox, setOutbox] = useState([]);
  const [busy, setBusy] = useState(false);
  // Developer tools are hidden by default: they are for testing and for the
  // jury, and they made the screen look like a debug console before.
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    api
      .settings()
      .then((loaded) => {
        setSettings(loaded);
        setOrgId(loaded.heimatInfo.organizationId || "");
        setStatus(loaded.heimatInfo.status || "Draft");
      })
      .catch(() => {});
    api
      .outbox()
      .then(setOutbox)
      .catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    try {
      const saved = await api.saveSettings({
        heimatInfo: {
          organizationId: orgId.trim(),
          apiKey: apiKey.trim(),
          status,
        },
      });
      setSettings((current) => ({
        ...current,
        heimatInfo: { ...current.heimatInfo, ...saved.heimatInfo },
      }));
      setApiKey(""); // never keep the secret in the form
      notify(`💾 ${t("cn_saved")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  /** GET /External/organizations — proves the key works and lists the ids. */
  async function test() {
    setBusy(true);
    try {
      const response = await api.testHeimat(apiKey.trim() || undefined);
      setResult(response);
      notify(
        response.ok
          ? `✅ ${t(response.resultKey, response.params)}`
          : `⚠️ ${t(response.resultKey, response.params)}`
      );
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  /** Create a harmless post with status Draft to verify write access. */
  async function ping() {
    setBusy(true);
    try {
      const response = await api.pingHeimat();
      setResult({
        ok: response.ok,
        resultKey: response.messageKey,
        params: response.params,
        postId: response.postId,
      });
      notify(
        response.ok
          ? `✅ ${t("cn_test_post_ok")}`
          : `⚠️ ${t(response.messageKey, response.params)}`
      );
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  if (!settings) return <p className="loading">{t("c_loading")}</p>;

  return (
    <div className="stack">
      <div>
        <h1>🔌 {t("cn_title")}</h1>
        <p className="muted small">{t("cn_sub")}</p>
      </div>

      {/* --------------------------------------------- credentials ------ */}
      <Card icon="🔑" title={t("cn_cred")}>
        <Field label={`🏢 ${t("cn_org")}`} htmlFor="org">
          <input
            id="org"
            className="mono"
            type="text"
            value={orgId}
            placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
            onChange={(event) => setOrgId(event.target.value)}
          />
        </Field>

        <Field
          label={`🔐 ${t("cn_key")}`}
          hint={
            settings.heimatInfo.hasApiKey
              ? t("cn_key_stored", { masked: settings.heimatInfo.apiKeyMasked })
              : undefined
          }
          htmlFor="key"
        >
          <input
            id="key"
            type="password"
            value={apiKey}
            placeholder={t("cn_key_ph")}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </Field>

        <Field label={`📤 ${t("cn_status")}`} htmlFor="status">
          <select
            id="status"
            className="control"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="Draft">{t("cn_status_draft")}</option>
            <option value="Published">{t("cn_status_pub")}</option>
          </select>
        </Field>

        <div className="row">
          <Button icon="💾" onClick={save} disabled={busy}>
            {t("c_save")}
          </Button>
          <Button variant="ghost" icon="🔍" onClick={test} disabled={busy}>
            {t("cn_test")}
          </Button>
          <Button
            variant="ghost"
            icon="📨"
            onClick={ping}
            disabled={busy || !settings.heimatInfo.hasApiKey}
          >
            {t("cn_ping")}
          </Button>
        </div>

        {/* ------------------------------------------- test result ------ */}
        {result && (
          <div style={{ marginTop: 16 }}>
            <Badge tone={result.ok ? "ok" : "danger"}>
              {result.ok ? "✅" : "⚠️"}{" "}
              {t(result.resultKey, result.params || {})}
            </Badge>

            {result.organizations?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="xs muted" style={{ fontWeight: 700 }}>
                  {t("cn_orgs")}
                </p>
                <div className="list">
                  {result.organizations.map((organization) => (
                    <Item
                      key={organization.id}
                      icon="🏢"
                      title={organization.name}
                      meta={<span className="mono">{organization.id}</span>}
                      tail={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOrgId(organization.id);
                            notify(`📋 ${t("cn_id_taken")}`);
                          }}
                        >
                          {t("cn_use_this")}
                        </Button>
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {result.ok && (
              <p className="small" style={{ marginTop: 10, marginBottom: 0 }}>
                <a href={REVIEW_URL} target="_blank" rel="noreferrer">
                  🔗 {t("cn_review")}
                </a>
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ------------------------------------------ how it works -------- */}
      <Card icon="📘" title={t("cn_how")}>
        <ul className="bullets small">
          <li>
            {t("cn_how_endpoint")}
            <br />
            <span className="mono">
              POST /External/organizations/&#123;organizationId&#125;/posts
            </span>
          </li>
          <li>{t("cn_how_auth")}</li>
          <li>{t("cn_how_payload")}</li>
          <li>{t("cn_how_html")}</li>
          <li>{t("cn_how_fallback")}</li>
        </ul>
        <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>
          <a href={SWAGGER_URL} target="_blank" rel="noreferrer">
            🔗 {t("cn_swagger")}
          </a>
        </p>
      </Card>

      {/* -------------------------------------------------- channels ---- */}
      <Card icon="📡" title={t("cn_channels")}>
        <div className="list">
          {catalog.channels.map((channel) => (
            <Item
              key={channel.id}
              icon={channel.icon}
              title={channelName(t, channel.id)}
              tail={
                channel.external ? (
                  <Badge
                    tone={settings.heimatInfo.hasApiKey ? "ok" : undefined}
                  >
                    {settings.heimatInfo.hasApiKey
                      ? `🔑 ${t("cn_configured")}`
                      : `⚪ ${t("cn_unconfigured")}`}
                  </Badge>
                ) : undefined
              }
              meta={channel.criticalOnly ? t("ch_critical") : t("ch_always")}
            />
          ))}
        </div>
      </Card>

      {/* ------------------------------------------ developer tools ---- */}
      {/* Collapsed by default. Everything in here is for testing or for
          showing a juror the raw output - never needed in daily operation. */}
      <Card
        icon="🧰"
        title={t("dev_tools")}
        subtitle={showDev ? t("dev_hint") : undefined}
        tail={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDev(!showDev)}
          >
            {showDev ? t("dev_hide") : t("dev_show")}
          </Button>
        }
      >
        {showDev && (
          <>
            {/* machine-readable outputs, moved here from the citizen page */}
            <p
              className="xs muted"
              style={{ fontWeight: 700, marginBottom: 8 }}
            >
              {t("pb_machine")}
            </p>
            <div className="row">
              <a
                className="btn btn--ghost btn--sm"
                href="/feed.xml"
                target="_blank"
                rel="noreferrer"
              >
                📡 RSS
              </a>
              <a
                className="btn btn--ghost btn--sm"
                href="/widget"
                target="_blank"
                rel="noreferrer"
              >
                🧩 Widget
              </a>
              <a
                className="btn btn--ghost btn--sm"
                href="/api/public/status?lang=de"
                target="_blank"
                rel="noreferrer"
              >
                🧾 JSON
              </a>
            </div>

            <hr className="divider" />

            {/* demo data */}
            <div className="row">
              <Button
                size="sm"
                variant="ghost"
                icon="🌱"
                disabled={busy}
                onClick={async () => {
                  await api.seed();
                  await refresh();
                  setOutbox(await api.outbox());
                  notify(`🌱 ${t("cn_seeded")}`);
                }}
              >
                {t("cn_seed")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon="🗑️"
                disabled={busy}
                onClick={async () => {
                  await api.reset();
                  await refresh();
                  setOutbox([]);
                  notify(`🗑️ ${t("cn_reset_done")}`);
                }}
              >
                {t("cn_reset")}
              </Button>
            </div>

            <hr className="divider" />

            {/* local sink for push / webhook / press */}
            <p
              className="xs muted"
              style={{ fontWeight: 700, marginBottom: 8 }}
            >
              {t("cn_outbox")} ({outbox.length})
            </p>
            {outbox.length === 0 && (
              <p className="small muted" style={{ margin: 0 }}>
                {t("cn_outbox_empty")}
              </p>
            )}
            <div className="list">
              {outbox.slice(0, 5).map((entry) => (
                <Item
                  key={entry.id}
                  icon={
                    { push: "🔔", webhook: "🔗", press: "📰" }[entry.channel] ||
                    "📄"
                  }
                  title={channelName(t, entry.channel)}
                  meta={
                    <span className="xs">
                      {(
                        entry.body || JSON.stringify(entry.payload || {})
                      ).slice(0, 110)}
                      …
                    </span>
                  }
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
