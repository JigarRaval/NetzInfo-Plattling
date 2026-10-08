/**
 * Approve.jsx — read the message, press one button.
 *
 * This screen was deliberately rebuilt to be boring. The daily job is exactly
 * two things: read the text, approve it. Everything that exists to convince a
 * jury (the checks, the severity reasoning, the channel log) is either folded
 * away behind one "show details" link or only appears AFTER publishing, where
 * it is a result rather than a decision.
 *
 * Three rules this screen follows:
 *   1. only drafts that still need a decision are listed
 *   2. once approved, the draft turns into a result card and leaves the list
 *   3. only the button that makes sense right now is visible
 *
 * IMPORTANT: every action is derived from the DATA, never from temporary
 * component state. An earlier version put the "send the all-clear" button
 * inside the result card only, so leaving the tab unmounted the component and
 * the option disappeared with it. The "Running outages" section below is
 * computed from the incident list, so it survives navigation, reloads and
 * another person taking over the shift.
 */

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { duration, secondsSince } from "../lib/clock.js";
import { Badge, Button, Card, CheckLine, Empty, Item } from "../ui/kit.jsx";
import { LANGUAGES } from "../i18n/index.jsx";
import {
  channelMessage,
  channelName,
  channelState,
  checkText,
  clockTime,
  presetName,
  relativeTime,
  serviceIcon,
  severity,
  severityReason,
} from "../lib/format.js";

export default function Approve({
  t,
  lang,
  now,
  catalog,
  incidents,
  drafts,
  refresh,
  notify,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [previewLang, setPreviewLang] = useState(lang);
  const [showDetails, setShowDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [result, setResult] = useState(null); // the publication just made
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState(false);

  // Only drafts that still need a human decision belong on this screen.
  const openDrafts = drafts.filter((d) => d.status === "draft");
  const selected =
    openDrafts.find((d) => d.id === selectedId) || openDrafts[0] || null;
  const incident = selected
    ? incidents.find((i) => i.id === selected.incidentId)
    : null;

  // Published but not finished: these still need an all-clear at some point.
  // Derived from the incident list, so the option can never go missing.
  const runningIncidents = incidents.filter(
    (i) => i.status !== "resolved" && i.publishedAt
  );

  useEffect(() => {
    api
      .publications()
      .then((rows) => setRecent(rows.slice(0, 3)))
      .catch(() => {});
  }, [drafts]);
  useEffect(() => {
    setPreviewLang(lang);
  }, [lang]);
  useEffect(() => {
    setEditing(false);
    setShowDetails(false);
  }, [selectedId]);

  /* --- the one action of this screen ------------------------------------ */
  async function approve() {
    setBusy(true);
    try {
      const response = await api.approve(selected.id, "Leitstelle");
      setResult(response.publication);
      setSelectedId(null);
      await refresh(); // the approved draft leaves the list
      notify(
        `🚀 ${t("ap_published_in", {
          time: duration(response.publication.kpiSeconds),
        })}`
      );
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  /**
   * One click: resolve the incident, write the all-clear, publish it.
   *
   * It first tries the single endpoint POST /api/incidents/:id/close.
   * If that route is missing (HTTP 404 — an older backend, or a server that
   * was not restarted after an update), it falls back to the three original
   * calls that every version supports. The button therefore works no matter
   * which backend build is running, and the user never sees a dead end.
   */
  async function closeIncident(incidentId) {
    setBusy(true);
    try {
      let publication;
      try {
        publication = (await api.close(incidentId)).publication;
      } catch (error) {
        if (error.status !== 404) throw error; // a real failure
        // Fallback for older servers: resolve → generate all-clear → approve.
        await api.resolve(incidentId);
        const draft = await api.createDraft(incidentId, "allclear");
        publication = (await api.approve(draft.id, "Leitstelle")).publication;
      }
      setResult(publication);
      await refresh();
      notify(`✅ ${t("ap_close_done")}`);
    } catch (error) {
      // Show what actually went wrong instead of a generic message.
      notify(
        `⚠️ ${t("c_error")}: ${error.status || ""} ${
          error.message || ""
        }`.trim()
      );
    } finally {
      setBusy(false);
    }
  }

  /** Writing an update creates a draft that then needs the normal approval. */
  async function writeUpdate(incidentId) {
    setBusy(true);
    try {
      const draft = await api.createDraft(incidentId, "update");
      await refresh();
      setResult(null);
      setSelectedId(draft.id);
      notify(`✏️ ${t("ap_update_made")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await api.editDraft(selected.id, draftText);
      await refresh();
      setEditing(false);
      notify(`💾 ${t("ap_saved")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  const passed = selected ? selected.checks.filter((c) => c.ok).length : 0;

  return (
    <div className="stack">
      <div>
        <h1>✅ {t("ap_title")}</h1>
        <p className="muted small">{t("ap_sub")}</p>
      </div>

      {/* ================= RESULT of what was just published ============== */}
      {result && (
        <>
          <Card className="result">
            <div className="result-head">
              <span className="result-ico" aria-hidden="true">
                ✅
              </span>
              <div>
                <h2>
                  {t("ap_done_title")} · {duration(result.kpiSeconds)}
                </h2>
                <p className="small muted">
                  {t("ap_done_text")} ·{" "}
                  {t("ap_reached", {
                    ok: result.okCount,
                    total: result.totalCount,
                  })}
                </p>
              </div>
            </div>

            <div className="list" style={{ marginTop: 12 }}>
              {result.results.map((channelResult) => {
                const state = channelState(channelResult);
                return (
                  <Item
                    key={channelResult.channel}
                    icon={state.icon}
                    title={`${channelResult.icon} ${channelName(
                      t,
                      channelResult.channel
                    )}`}
                    tail={
                      <span className="xs muted">{channelResult.ms} ms</span>
                    }
                    meta={channelMessage(t, channelResult)}
                  />
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ========== RUNNING OUTAGES: always reachable, comes from data ==== */}
      {/* Everything published that is not finished yet. This is the permanent
          home of the all-clear, independent of what happened in this session. */}
      <Card icon="🔆" title={t("ap_running")} subtitle={t("ap_running_hint")}>
        {runningIncidents.length === 0 && (
          <p className="small muted" style={{ margin: 0 }}>
            {t("ap_running_none")}
          </p>
        )}

        <div className="stack-sm">
          {runningIncidents.map((runningIncident) => (
            <div key={runningIncident.id} className="running">
              <div className="between">
                <div className="row">
                  <span aria-hidden="true" style={{ fontSize: 22 }}>
                    {serviceIcon(catalog, runningIncident.service)}
                  </span>
                  <div>
                    <div className="item-title">
                      {presetName(catalog, runningIncident.presetId, lang)}
                    </div>
                    <div className="item-meta">
                      📍{" "}
                      {runningIncident.districts
                        .map(
                          (id) =>
                            catalog.districts.find((d) => d.id === id)?.name
                        )
                        .filter(Boolean)
                        .join(", ")}
                      {" · "}
                      {t("ap_since_label", {
                        time: clockTime(runningIncident.startedAt, lang),
                      })}
                    </div>
                  </div>
                </div>
                <Badge tone={severity(t, runningIncident.severity).tone}>
                  {severity(t, runningIncident.severity).icon}{" "}
                  {severity(t, runningIncident.severity).label}
                </Badge>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <Button
                  variant="ok"
                  icon="✅"
                  disabled={busy}
                  onClick={() => closeIncident(runningIncident.id)}
                >
                  {busy ? t("ap_close_busy") : t("ap_close_btn")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="🔄"
                  disabled={busy}
                  onClick={() => writeUpdate(runningIncident.id)}
                >
                  {t("ap_update_btn")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= THE DECISION: one draft, one button ============ */}
      {selected && incident ? (
        <>
          {/* Only shown when more than one thing is waiting. */}
          {openDrafts.length > 1 && (
            <div className="chips">
              {openDrafts.map((draft) => {
                const draftIncident = incidents.find(
                  (i) => i.id === draft.incidentId
                );
                return (
                  <button
                    key={draft.id}
                    className="chip"
                    aria-pressed={selected.id === draft.id}
                    onClick={() => setSelectedId(draft.id)}
                  >
                    {draftIncident
                      ? serviceIcon(catalog, draftIncident.service)
                      : "📄"}{" "}
                    {draftIncident
                      ? presetName(catalog, draftIncident.presetId, lang)
                      : draft.incidentId}
                  </button>
                );
              })}
            </div>
          )}

          <Card>
            {/* ---- what this is, in one line -------------------------- */}
            <div className="between" style={{ marginBottom: 14 }}>
              <div className="row">
                <Badge tone="warn">⏳ {t("ap_waiting")}</Badge>
                <Badge>
                  {{ first: "🆕", update: "🔄", allclear: "✅" }[selected.kind]}{" "}
                  {t(`kind_${selected.kind}`)}
                </Badge>
                <Badge tone={severity(t, incident.severity).tone}>
                  {severity(t, incident.severity).icon}{" "}
                  {severity(t, incident.severity).label}
                </Badge>
              </div>
              <span className="xs muted">
                {t("ap_elapsed", {
                  time: duration(
                    secondsSince(
                      selected.kind === "first"
                        ? incident.capturedAt
                        : selected.createdAt,
                      now
                    )
                  ),
                })}
              </span>
            </div>

            {/* ---- the message itself --------------------------------- */}
            <div className="between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>
                {(selected.messages[previewLang] || selected.messages.de).title}
              </h2>
              <select
                className="select control"
                value={previewLang}
                onChange={(event) => setPreviewLang(event.target.value)}
                aria-label={t("ap_preview_lang")}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.id.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {editing ? (
              <>
                <textarea
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                />
                <div className="row" style={{ marginTop: 10 }}>
                  <Button
                    size="sm"
                    icon="💾"
                    onClick={saveEdit}
                    disabled={busy}
                  >
                    {t("c_save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    {t("c_cancel")}
                  </Button>
                </div>
              </>
            ) : (
              <pre className="message">
                {(selected.messages[previewLang] || selected.messages.de).text}
              </pre>
            )}

            {/* ---- checks: one line, details on request ---------------- */}
            <div className="checkbar">
              <span className={selected.allOk ? "checkbar-ok" : "checkbar-bad"}>
                {selected.allOk ? "✅" : "⚠️"}{" "}
                {t("ap_checks_passed", {
                  ok: passed,
                  total: selected.checks.length,
                })}
              </span>
              <button
                className="linkbtn"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? t("ap_details_hide") : t("ap_details_show")}
              </button>
            </div>

            {showDetails && (
              <div className="details">
                {selected.checks.map((check) => {
                  const text = checkText(t, check);
                  return (
                    <CheckLine
                      key={check.id}
                      ok={check.ok}
                      title={text.title}
                      detail={text.detail}
                    />
                  );
                })}

                <p
                  className="xs muted"
                  style={{ fontWeight: 700, margin: "14px 0 6px" }}
                >
                  {t("ap_why_title")}
                </p>
                <ul className="bullets small muted">
                  {incident.severityReasons.map((reason, index) => (
                    <li key={index}>
                      {severityReason(t, reason, catalog, lang)}
                    </li>
                  ))}
                </ul>

                {!editing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="✏️"
                    className="editbtn"
                    onClick={() => {
                      setDraftText(selected.messages.de.text);
                      setPreviewLang("de");
                      setEditing(true);
                    }}
                  >
                    {t("ap_edit")}
                  </Button>
                )}
                {selected.edited && (
                  <p className="xs muted" style={{ marginTop: 10 }}>
                    ✏️ {t("ap_edited_note")}
                  </p>
                )}
              </div>
            )}

            {/* ---- the one button ------------------------------------- */}
            <Button
              block
              variant="ok"
              icon="🚀"
              className="approvebtn"
              onClick={approve}
              disabled={busy || !selected.allOk}
            >
              {busy ? t("ap_approving") : t("ap_approve")}
            </Button>
            {!selected.allOk && (
              <p
                className="small"
                style={{
                  color: "var(--danger)",
                  marginTop: 10,
                  marginBottom: 0,
                }}
              >
                ⚠️ {t("ap_blocked")}
              </p>
            )}
          </Card>
        </>
      ) : (
        !result && (
          <Card>
            <Empty icon="🎉">{t("ap_open_empty")}</Empty>
          </Card>
        )
      )}

      {/* ================= small history, read-only ======================= */}
      {recent.length > 0 && (
        <Card icon="🗒️" title={t("ap_recent")}>
          <div className="list">
            {recent.map((publication) => (
              <Item
                key={publication.id}
                icon={
                  { first: "🆕", update: "🔄", allclear: "✅" }[
                    publication.kind
                  ]
                }
                title={
                  publication.messages[lang]?.title ||
                  publication.messages.de.title
                }
                tail={
                  <Badge tone="ok">{duration(publication.kpiSeconds)}</Badge>
                }
                meta={`${relativeTime(publication.at, now, t)} · ${t(
                  "ap_reached",
                  { ok: publication.okCount, total: publication.totalCount }
                )}`}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
