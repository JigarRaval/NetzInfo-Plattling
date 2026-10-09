/**
 * Home.jsx - the only screen most people need.
 *
 * It answers two questions and offers two actions:
 *   Is anything broken?      -> the banner at the top
 *   What still needs doing?  -> the running outages, each with one button
 *   Report something new     -> the big button
 *   Tell people it is fixed  -> "Fixed - send the all-clear"
 *
 * Nothing else: no stopwatch, no statistics, no secondary navigation.
 */

import React, { useState } from "react";
import { api } from "../lib/api.js";
import { Button, Card, Empty, Hero, Item } from "../ui/kit.jsx";
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
  const [showAllHistory, setShowAllHistory] = useState(false);

  const running = incidents.filter(
    (i) => i.status !== "resolved" && i.publishedAt
  );
  const resolved = incidents.filter((i) => i.status === "resolved");
  const displayedResolved = showAllHistory ? resolved : resolved.slice(0, 4);
  const waiting = drafts.filter((d) => d.status === "draft").length;

  /** One press: mark the outage as fixed, write the all-clear, send it. */
  async function close(incidentId) {
    setBusy(incidentId);
    try {
      await api.close(incidentId);
      await refresh();
      notify(`✅ ${t("hm_close_done")}`);
    } catch (error) {
      notify(
        `⚠️ ${t("c_error")}: ${error.status || ""} ${
          error.message || ""
        }`.trim()
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
      notify(`✏️ ${t("hm_update_made")}`);
      go("send");
    } catch (error) {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="stack">
      {/* ------------------------------------------------ overall state -- */}
      {running.length === 0 ? (
        <Hero
          tone="ok"
          icon="✅"
          title={t("hm_ok_title")}
          text={t("hm_ok_text")}
        />
      ) : (
        <Hero
          tone="alert"
          icon="🚨"
          title={t("hm_alert_title", { n: running.length })}
          text={t("hm_alert_text")}
        />
      )}

      {/* ------------------------------------------------- main action --- */}
      <Button block icon="📝" onClick={() => go("report")}>
        {t("hm_report_btn")}
      </Button>

      {/* --------------------------------- something waiting to be sent -- */}
      {waiting > 0 && (
        <Card icon="📤" title={t("hm_waiting", { n: waiting })}>
          <Button variant="ghost" icon="📤" onClick={() => go("send")}>
            {t("hm_waiting_btn")}
          </Button>
        </Card>
      )}

      {/* --------------------------------------------- running outages --- */}
      <Card icon="🔆" title={t("hm_running")}>
        {running.length === 0 && (
          <p className="small muted" style={{ margin: 0 }}>
            {t("hm_running_none")}
          </p>
        )}

        <div className="stack-sm">
          {running.map((incident) => (
            <div key={incident.id} className="running">
              <div className="row" style={{ alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ fontSize: 26 }}>
                  {serviceIcon(catalog, incident.service)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-title">
                    {serviceName(catalog, incident.service, lang)} ·{" "}
                    {presetName(catalog, incident.presetId, lang)}
                  </div>
                  <div className="item-meta">
                    📍 {districtNames(catalog, incident.districts)}
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

              <div className="row" style={{ marginTop: 12 }}>
                <Button
                  variant="ok"
                  icon="✅"
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
                  icon="🕒"
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

      {/* --------------------------------------------------- short history */}
      {resolved.length > 0 && (
        <Card icon="📜" title={t("hm_history")}>
          <div className="list">
            {displayedResolved.map((incident) => (
              <Item
                key={incident.id}
                icon={serviceIcon(catalog, incident.service)}
                title={`${serviceName(
                  catalog,
                  incident.service,
                  lang
                )} · ${districtNames(catalog, incident.districts)}`}
                meta={
                  <>
                    ✅ {relativeTime(
                      incident.resolvedAt || incident.capturedAt,
                      t
                    )}
                    {incident.reportedBy?.name && (
                      <>
                        {" · "}
                        {t("hm_reported_by", {
                          name: incident.reportedBy.name,
                        })}
                      </>
                    )}
                  </>
                }
              />
            ))}
          </div>
          {resolved.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory ? t("c_show_less") : t("c_show_more")}
            </Button>
          )}
        </Card>
      )}

      {incidents.length === 0 && (
        <Card>
          <Empty icon="📭">{t("hm_running_none")}</Empty>
        </Card>
      )}
    </div>
  );
}
