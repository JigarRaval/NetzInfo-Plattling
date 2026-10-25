/**
 * Home.jsx - the only screen most people need.
 */

import React, { useState } from "react";
import { api } from "../lib/api.js";
import { Button, Card, Empty, Hero, Item, renderIcon } from "../ui/kit.jsx";
import {
  clockTime,
  districtNames,
  presetName,
  relativeTime,
  serviceIcon,
  serviceName,
} from "../lib/format.js";

export default function Home({
  t,
  lang,
  catalog,
  incidents,
  drafts,
  refresh,
  notify,
  go,
}) {
  const [busy, setBusy] = useState("");
  const [historyCount, setHistoryCount] = useState(4);
  const [expandedId, setExpandedId] = useState(null);

  // State for Overdue ETA inputs (keyed by incident ID)
  const [newEtas, setNewEtas] = useState({});

  const running = incidents.filter(
    (i) => i.status !== "resolved" && i.publishedAt
  );

  // Find incidents where the ETA has passed
  const overdue = running.filter(
    (i) => i.etaAt && new Date(i.etaAt) < new Date()
  );

  // Running incidents that are NOT overdue yet
  const onTrack = running.filter((i) => !overdue.some((o) => o.id === i.id));

  const resolved = incidents.filter((i) => i.status === "resolved");
  const displayedResolved = resolved.slice(0, historyCount);
  const waiting = drafts.filter((d) => d.status === "draft").length;

  /** Handle updating the ETA and jumping to the Send screen */
  async function handleDelay(incidentId) {
    const newTime = newEtas[incidentId] || getDefaultTimeString();
    const incident = incidents.find((i) => i.id === incidentId);

    if (!incident) return;

    const startedAt = new Date(incident.startedAt);
    const newEta = new Date(newTime);

    if (newEta <= new Date()) {
      notify("Please select a time in the future.");
      return;
    }

    // Calculate the new etaMinutes so the backend recalculate function uses the new time
    const etaMinutes = Math.round((newEta - startedAt) / 60000);

    setBusy(incidentId);
    try {
      // 1. Update the incident ETA and etaMinutes in the database
      await api.updateIncident(incidentId, {
        etaAt: newEta.toISOString(),
        etaMinutes,
      });

      // 2. Make sure a draft exists (Scheduler might have already made one)
      const existingDraft = drafts.find(
        (d) => d.incidentId === incidentId && d.status === "draft"
      );
      if (!existingDraft) {
        await api.createDraft(incidentId, "update");
      }

      await refresh();
      go("send"); // Take worker to the Send screen to edit and broadcast
    } catch (error) {
      notify(`${t("c_error")}: ${error.message}`);
    } finally {
      setBusy("");
    }
  }

  /** One press: mark the outage as fixed, write the all-clear, send it. */
  async function close(incidentId) {
    setBusy(incidentId);
    try {
      await api.close(incidentId);
      await refresh();
      notify(`${t("hm_close_done")}`);
    } catch (error) {
      notify(
        `${t("c_error")}: ${error.status || ""} ${error.message || ""}`.trim()
      );
    } finally {
      setBusy("");
    }
  }

  /** Prepare an update; it is sent from the Send screen like any other text. */
  async function update(incidentId) {
    setBusy(incidentId);
    try {
      await api.createDraft(incidentId, "update");
      await refresh();
      notify(`${t("hm_update_made")}`);
      go("send");
    } catch (error) {
      notify(`${t("c_error")}`);
    } finally {
      setBusy("");
    }
  }

  // Helper to generate a default time string for the input (e.g., +30 mins from now)
  const getDefaultTimeString = () => {
    const d = new Date(Date.now() + 30 * 60000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="stack">
      {/* ------------------------------------------------ overall state -- */}
      {running.length === 0 ? (
        <Hero
          tone="ok"
          icon="check"
          title={t("hm_ok_title")}
          text={t("hm_ok_text")}
        />
      ) : (
        <Hero
          tone="alert"
          icon="alert"
          title={t("hm_alert_title", { n: running.length })}
          text={t("hm_alert_text")}
        />
      )}

      {/* ------------------------------------------------- main action --- */}
      <Button block icon="edit" onClick={() => go("report")}>
        {t("hm_report_btn")}
      </Button>

      {/* ----------------------------------------- OVERDUE INCIDENTS ----- */}
      {overdue.length > 0 && (
        <Card icon="clock" title="Action Required: Overdue Outages">
          <p
            className="small muted"
            style={{ marginTop: -8, marginBottom: 12 }}
          >
            The estimated time has passed. Please provide a new update.
          </p>
          <div className="stack-sm">
            {overdue.map((incident) => (
              <div
                key={incident.id}
                style={{
                  border: "1px solid var(--danger)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px",
                  background: "var(--danger-bg)",
                }}
              >
                <div className="item-title" style={{ color: "var(--danger)" }}>
                  {serviceName(catalog, incident.service, lang)} ·{" "}
                  {districtNames(catalog, incident.districts)}
                </div>
                <div className="item-meta" style={{ marginBottom: 12 }}>
                  Original ETA: {clockTime(incident.etaAt, lang)}
                </div>

                <div
                  className="row"
                  style={{ alignItems: "flex-end", gap: 10 }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      className="field-label"
                      style={{ fontSize: "12px", marginBottom: 4 }}
                    >
                      New Estimated Time
                    </label>
                    <input
                      type="datetime-local"
                      className="control"
                      style={{ width: "100%" }}
                      value={newEtas[incident.id] || getDefaultTimeString()}
                      onChange={(e) =>
                        setNewEtas({
                          ...newEtas,
                          [incident.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    variant="primary"
                    icon="send"
                    disabled={busy === incident.id}
                    onClick={() => handleDelay(incident.id)}
                  >
                    {busy === incident.id ? "Loading..." : "Prepare Update"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* --------------------------------- something waiting to be sent -- */}
      {waiting > 0 && (
        <Card icon="send" title={t("hm_waiting", { n: waiting })}>
          <Button variant="ghost" icon="send" onClick={() => go("send")}>
            {t("hm_waiting_btn")}
          </Button>
        </Card>
      )}

      {/* --------------------------------------------- running outages --- */}
      {onTrack.length > 0 && (
        <Card icon="sunBright" title="Running Outages (On Track)">
          <div className="stack-sm">
            {onTrack.map((incident) => (
              <div
                key={incident.id}
                className="running clickable"
                onClick={() => go(`incident/${incident.id}`)}
              >
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <span className="ico" aria-hidden="true">
                    {renderIcon(serviceIcon(catalog, incident.service), 26)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="item-title">
                      {serviceName(catalog, incident.service, lang)} ·{" "}
                      {presetName(catalog, incident.presetId, lang)}
                    </div>
                    <div className="item-meta">
                      {districtNames(catalog, incident.districts)}
                      {" · "}
                      {t("hm_since", {
                        time: clockTime(incident.startedAt, lang),
                      })}
                      {" · "}
                      {t("hm_until", { time: clockTime(incident.etaAt, lang) })}
                      {incident.reportedBy?.name && (
                        <>
                          {" "}
                          ·{" "}
                          {t("hm_reported_by", {
                            name: incident.reportedBy.name,
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="row"
                  style={{ marginTop: 12 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ok"
                    icon="check"
                    disabled={busy === incident.id}
                    onClick={() => close(incident.id)}
                  >
                    {busy === incident.id
                      ? t("hm_close_busy")
                      : t("hm_close_btn")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="clock"
                    disabled={busy === incident.id}
                    onClick={() => update(incident.id)}
                  >
                    {t("hm_update_btn")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* --------------------------------------------------- short history */}
      {resolved.length > 0 && (
        <Card icon="scroll" title={t("hm_history")}>
          <div className="list">
            {displayedResolved.map((incident) => (
              <React.Fragment key={incident.id}>
                <Item
                  icon={serviceIcon(catalog, incident.service)}
                  title={`${serviceName(
                    catalog,
                    incident.service,
                    lang
                  )} · ${districtNames(catalog, incident.districts)}`}
                  meta={
                    <>
                      {relativeTime(
                        incident.resolvedAt || incident.capturedAt,
                        t
                      )}
                      {incident.reportedBy?.name && (
                        <>
                          {" "}
                          ·{" "}
                          {t("hm_reported_by", {
                            name: incident.reportedBy.name,
                          })}
                        </>
                      )}
                    </>
                  }
                  onClick={() =>
                    setExpandedId(
                      expandedId === incident.id ? null : incident.id
                    )
                  }
                />

                {expandedId === incident.id && (
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)",
                      marginTop: "4px",
                      marginBottom: "12px",
                      border: "1px solid var(--border)",
                      animation: "fadeIn 0.2s ease-out",
                    }}
                  >
                    <div
                      className="stack-sm"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      <div>
                        <strong>{t("id_districts")}:</strong>{" "}
                        {districtNames(catalog, incident.districts)}
                      </div>
                      {incident.street && (
                        <div>
                          <strong>{t("id_street")}:</strong> {incident.street}
                        </div>
                      )}
                      <div>
                        <strong>{t("id_started")}:</strong>{" "}
                        {clockTime(incident.startedAt, lang)}
                      </div>
                      {incident.etaAt && (
                        <div>
                          <strong>{t("id_eta")}:</strong>{" "}
                          {clockTime(incident.etaAt, lang)}
                        </div>
                      )}
                      {incident.resolvedAt && (
                        <div>
                          <strong>{t("id_resolved")}:</strong>{" "}
                          {clockTime(incident.resolvedAt, lang)}
                        </div>
                      )}
                      {incident.publishedAt && (
                        <div>
                          <strong>{t("id_published")}:</strong>{" "}
                          {clockTime(incident.publishedAt, lang)}
                        </div>
                      )}
                      <div>
                        <strong>{t("id_status")}:</strong> {incident.status}
                      </div>
                      {incident.reportedBy?.name && (
                        <div>
                          <strong>{t("id_reported_by")}:</strong>{" "}
                          {incident.reportedBy.name}
                        </div>
                      )}
                      {incident.note && (
                        <div>
                          <strong>{t("id_note")}:</strong> {incident.note}
                        </div>
                      )}
                      <div>
                        <strong>{t("id_critical")}:</strong>{" "}
                        {incident.critical ? t("c_yes") : t("c_no")}
                      </div>
                      <div>
                        <strong>{t("id_planned")}:</strong>{" "}
                        {incident.planned ? t("c_yes") : t("c_no")}
                      </div>
                      <div>
                        <strong>{t("id_id")}:</strong> {incident.id}
                      </div>
                    </div>
                    <div className="row" style={{ marginTop: 12 }}>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => go(`incident/${incident.id}`)}
                      >
                         View Full Page
                      </Button> */}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {resolved.length > 4 && (
            <div className="row" style={{ marginTop: 8 }}>
              {historyCount < resolved.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryCount(historyCount + 4)}
                >
                  {t("c_show_more")}
                </Button>
              )}
              {historyCount > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryCount(historyCount - 4)}
                >
                  {t("c_show_less")}
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {incidents.length === 0 && (
        <Card>
          <Empty icon="emptyMailbox">{t("hm_running_none")}</Empty>
        </Card>
      )}
    </div>
  );
}
