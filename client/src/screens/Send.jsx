/**
 * Send.jsx - read the generated text, then send it.
 *
 * The whole screen is one decision: is this text correct, yes or no. The
 * quality checks still run on the server, but they are silent: when
 * everything is fine nothing is shown, and only a real problem produces a
 * short warning above the button.
 */

import React, { useState } from "react";
import { api } from "../lib/api.js";
import { Button, Card, Empty, Item } from "../ui/kit.jsx";
import { LANGUAGES } from "../i18n/index.jsx";
import {
  channelIcon,
  channelMessage,
  channelName,
  districtNames,
  blockingProblems,
  presetName,
  serviceIcon,
} from "../lib/format.js";

export default function Send({
  t,
  lang,
  catalog,
  incidents,
  drafts,
  refresh,
  notify,
  go,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [previewLang, setPreviewLang] = useState(lang);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Only texts that still have to go out belong on this screen.
  const waiting = drafts.filter((d) => d.status === "draft");
  const selected =
    waiting.find((d) => d.id === selectedId) || waiting[0] || null;
  const incident = selected
    ? incidents.find((i) => i.id === selected.incidentId)
    : null;

  // The preview follows the language chosen in the header.
  React.useEffect(() => {
    setPreviewLang(lang);
  }, [lang]);
  React.useEffect(() => {
    setEditing(false);
  }, [selectedId]);

  async function send() {
    setBusy(true);
    try {
      const response = await api.publish(selected.id);
      setResult(response.publication);
      setSelectedId(null);
      await refresh();
      notify(`📤 ${t("sd_done_title")}`);
    } catch (error) {
      notify(
        `⚠️ ${t("c_error")}: ${error.status || ""} ${
          error.message || ""
        }`.trim()
      );
    } finally {
      setBusy(false);
    }
  }

  /** Throw away a report that was created by accident. */
  async function remove() {
    setBusy(true);
    try {
      await api.deleteDraft(selected.id);
      setConfirmDelete(false);
      setSelectedId(null);
      await refresh();
      notify(`🗑️ ${t("sd_deleted")}`);
    } catch (error) {
      notify(
        `⚠️ ${t("c_error")}: ${error.status || ""} ${
          error.message || ""
        }`.trim()
      );
    } finally {
      setBusy(false);
    }
  }

  /**
   * Write the text again - either because a manual edit went wrong, or to
   * change how the message sounds. The chosen tone is kept for every later
   * message of this incident.
   */
  async function regenerate(options) {
    setBusy(true);
    try {
      await api.regenerate(selected.id, options);
      await refresh();
      setEditing(false);
      notify(`♻️ ${t("sd_regenerated")}`);
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
      notify(`💾 ${t("sd_saved")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  const problems = selected ? blockingProblems(t, selected.checks) : [];

  return (
    <div className="stack">
      <div>
        <h1>📤 {t("sd_title")}</h1>
        <p className="muted small">{t("sd_sub")}</p>
      </div>

      {/* ------------------------------------------------- what was sent - */}
      {result && (
        <Card className="result">
          <div className="result-head">
            <span className="result-ico" aria-hidden="true">
              ✅
            </span>
            <div>
              <h2>{t("sd_done_title")}</h2>
              <p className="small muted">
                {t("sd_done_text")} ·{" "}
                {t("sd_reached", {
                  ok: result.okCount,
                  total: result.totalCount,
                })}
              </p>
            </div>
          </div>

          <div className="list" style={{ marginTop: 12 }}>
            {result.results.map((channel) => (
              <Item
                key={channel.channel}
                icon={channelIcon(channel)}
                title={`${channel.icon} ${channelName(t, channel.channel)}`}
                meta={channelMessage(t, channel)}
              />
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <Button variant="ghost" icon="🏠" onClick={() => go("home")}>
              {t("nav_home")}
            </Button>
          </div>
        </Card>
      )}

      {/* --------------------------------------------- the text to send -- */}
      {selected && incident ? (
        <>
          {waiting.length > 1 && (
            <div className="chips">
              {waiting.map((draft) => {
                const relatedIncident = incidents.find(
                  (i) => i.id === draft.incidentId
                );
                return (
                  <button
                    key={draft.id}
                    className="chip"
                    aria-pressed={selected.id === draft.id}
                    onClick={() => setSelectedId(draft.id)}
                  >
                    {relatedIncident
                      ? serviceIcon(catalog, relatedIncident.service)
                      : "📄"}{" "}
                    {relatedIncident
                      ? presetName(catalog, relatedIncident.presetId, lang)
                      : draft.incidentId}
                  </button>
                );
              })}
            </div>
          )}

          <Card>
            {/* The three states must be recognisable before reading a word:
                a red dot for a new outage, a cycle for an update, a green
                tick for the all-clear. Colour, icon and wording agree. */}
            <div className="between" style={{ marginBottom: 10 }}>
              <span className={`statechip statechip--${selected.kind}`}>
                {{ first: "🔴", update: "🔄", allclear: "✅" }[selected.kind]}{" "}
                {t(`kind_${selected.kind}`)}
              </span>
              <strong className="small">
                {districtNames(catalog, incident.districts)}
                {incident.reportedBy?.name && (
                  <span className="muted">
                    {" "}
                    · {t("hm_reported_by", { name: incident.reportedBy.name })}
                  </span>
                )}
              </strong>
              <select
                className="select control"
                value={previewLang}
                onChange={(event) => setPreviewLang(event.target.value)}
                aria-label={t("sd_lang")}
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
              <>
                {/* Tapping the text itself starts editing - the shortest
                    possible path to "I want to change one word". */}
                <pre
                  className={`message message--editable message--${selected.kind}`}
                  role="button"
                  tabIndex={0}
                  title={t("sd_edit")}
                  onClick={() => {
                    setDraftText(selected.messages.de.text);
                    setPreviewLang("de");
                    setEditing(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setDraftText(selected.messages.de.text);
                      setPreviewLang("de");
                      setEditing(true);
                    }
                  }}
                >
                  {
                    (selected.messages[previewLang] || selected.messages.de)
                      .text
                  }
                </pre>
                {selected.edited && (
                  <p className="xs muted" style={{ marginTop: 10 }}>
                    ✏️ {t("sd_edited")}
                  </p>
                )}
                <div className="row" style={{ marginTop: 12 }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="✏️"
                    onClick={() => {
                      setDraftText(selected.messages.de.text);
                      setPreviewLang("de");
                      setEditing(true);
                    }}
                  >
                    {t("sd_edit")}
                  </Button>

                  {/* write the whole text again, in the same tone */}
                  {/* different words for the same facts */}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="♻️"
                    disabled={busy}
                    onClick={() => regenerate({ shuffle: true })}
                  >
                    {t("sd_regenerate")}
                  </Button>

                  {/* or in a different tone, so the message calms people down */}
                  <select
                    className="select control"
                    value={incident.toneOverride || ""}
                    onChange={(event) =>
                      regenerate({ tone: event.target.value })
                    }
                    aria-label={t("sd_tone")}
                    disabled={busy}
                  >
                    <option value="" disabled>
                      {t("sd_tone")}
                    </option>
                    <option value="reassuring">{t("tone_reassuring")}</option>
                    <option value="steady">{t("tone_steady")}</option>
                    <option value="careful">{t("tone_careful")}</option>
                    <option value="light">{t("tone_light")}</option>
                  </select>
                </div>
                <p className="xs muted" style={{ marginTop: 8 }}>
                  {t("sd_edit_hint")}
                </p>
              </>
            )}

            {/* a warning appears only when something is actually wrong */}
            {problems.length > 0 && (
              <div className="warnbox">
                <strong>⚠️ {t("sd_problem")}</strong>
                <ul className="bullets small" style={{ marginTop: 6 }}>
                  {problems.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              block
              variant="ok"
              icon="📤"
              className="sendbtn"
              onClick={send}
              disabled={busy || problems.length > 0}
            >
              {busy ? t("sd_publishing") : t("sd_publish")}
            </Button>

            {/* Reported by mistake? Remove it before anything goes out.
                Deliberately below the send button and behind a confirmation. */}
            <div className="deleterow">
              {confirmDelete ? (
                <div className="row">
                  <span className="small">{t("sd_delete_sure")}</span>
                  <Button
                    size="sm"
                    variant="danger"
                    icon="🗑️"
                    onClick={remove}
                    disabled={busy}
                  >
                    {t("sd_delete_yes")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {t("c_cancel")}
                  </Button>
                </div>
              ) : (
                <button
                  className="linkish small"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("sd_delete")}
                </button>
              )}
            </div>
          </Card>
        </>
      ) : (
        !result && (
          <Card>
            <Empty icon="🎉">{t("sd_empty")}</Empty>
          </Card>
        )
      )}
    </div>
  );
}
