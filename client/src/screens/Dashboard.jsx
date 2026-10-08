/**
 * Dashboard.jsx — the control-room overview.
 *
 * Answers three questions in one glance:
 *   Is everything fine?  →  the status hero at the top
 *   Are we fast enough?  →  the KPI stopwatch
 *   What do I do next?   →  two large actions
 */

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { duration, secondsSince } from "../lib/clock.js";
import {
  Badge,
  Button,
  Card,
  Empty,
  Hero,
  Item,
  Kpi,
  Stat,
} from "../ui/kit.jsx";
import {
  clockTime,
  presetName,
  relativeTime,
  serviceIcon,
  serviceName,
  severity,
} from "../lib/format.js";

export default function Dashboard({
  t,
  lang,
  now,
  catalog,
  incidents,
  drafts,
  go,
  notify,
  refresh,
}) {
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    api
      .publications()
      .then(setPublications)
      .catch(() => {});
  }, [incidents, drafts]);

  const active = incidents.filter((i) => i.status !== "resolved");
  const openDrafts = drafts.filter((d) => d.status === "draft");

  /* --- KPI -------------------------------------------------------------
   * The clock runs live only while a FIRST notice is still unpublished.
   * Otherwise it shows the last measured publication, and the note below it
   * names the two moments that were measured, so the number is unambiguous:
   *   first notice -> captured ... published
   *   follow-up    -> written  ... published
   */
  const pending = active.find((i) => !i.publishedAt);
  const latest = publications[0];
  const seconds = pending
    ? secondsSince(pending.capturedAt, now)
    : latest?.kpiSeconds ?? 0;
  const withinTarget = seconds <= (catalog.kpiTargetSeconds || 180);

  let kpiLabel = t("db_kpi_none");
  let kpiNote = "";
  if (pending) {
    kpiLabel = t("db_kpi_waiting");
    kpiNote = t("db_kpi_span", {
      from: clockTime(pending.capturedAt, lang),
      to: "…",
    });
  } else if (latest) {
    kpiLabel =
      latest.measure === "followup" ? t("db_kpi_followup") : t("db_kpi_first");
    kpiNote = t("db_kpi_span", {
      from: clockTime(latest.measuredFrom || latest.at, lang),
      to: clockTime(latest.at, lang),
    });
  }

  const average = publications.length
    ? Math.round(
        publications.reduce((sum, p) => sum + p.kpiSeconds, 0) /
          publications.length
      )
    : null;

  return (
    <div className="stack">
      {/* ---------------------------------------------- overall state ---- */}
      {active.length === 0 ? (
        <Hero
          tone="ok"
          icon="✅"
          title={t("db_ok_title")}
          text={t("db_ok_text")}
        />
      ) : (
        <Hero
          tone="alert"
          icon="🚨"
          title={t("db_alert_title", { n: active.length })}
          text={t("db_alert_text")}
        />
      )}

      {/* ------------------------------------------------- KPI clock ----- */}
      <Kpi
        label={kpiLabel}
        time={latest || pending ? duration(seconds) : "–"}
        note={kpiNote}
        targetLabel={t("db_kpi_target")}
        stateLabel={withinTarget ? t("db_kpi_within") : t("db_kpi_over")}
        withinTarget={withinTarget}
      />

      {/* --------------------------------------------- next actions ------ */}
      {/* Only the two staff actions. The citizen page is reached through the
          view switch in the header, so a third button here was redundant. */}
      <div className="grid cols-2e">
        <Button icon="📝" onClick={() => go("report")}>
          {t("db_cta_report")}
        </Button>
        <Button icon="✅" variant="ghost" onClick={() => go("approve")}>
          {t("db_cta_approve")}
          {openDrafts.length > 0 ? ` (${openDrafts.length})` : ""}
        </Button>
      </div>

      {openDrafts.length > 0 && (
        <p className="small muted" style={{ margin: 0 }}>
          ⏳ {t("db_pending", { n: openDrafts.length })}
        </p>
      )}

      {/* ------------------------------------------------ key figures ---- */}
      <div className="grid cols-3">
        <Stat label={t("db_stat_pubs")} value={publications.length} />
        <Stat
          label={t("db_stat_channels")}
          value={latest ? `${latest.okCount}/${latest.totalCount}` : "–"}
        />
        <Stat
          label={t("db_stat_avg")}
          value={average === null ? "–" : duration(average)}
        />
      </div>

      {/* ------------------------------------------------- incidents ----- */}
      <Card
        icon="📋"
        title={t("db_active_title")}
        tail={
          <Button
            size="sm"
            variant="ghost"
            icon="🔄"
            onClick={() =>
              refresh().then(() => notify(`🔄 ${t("c_refreshed")}`))
            }
          >
            {t("c_refresh")}
          </Button>
        }
      >
        {incidents.length === 0 && <Empty icon="📭">{t("db_empty")}</Empty>}

        <div className="list">
          {incidents.slice(0, 8).map((incident) => {
            const level = severity(t, incident.severity);
            const districts = incident.districts
              .map((id) => catalog.districts.find((d) => d.id === id)?.name)
              .filter(Boolean)
              .join(", ");

            return (
              <Item
                key={incident.id}
                icon={serviceIcon(catalog, incident.service)}
                title={`${serviceName(
                  catalog,
                  incident.service,
                  lang
                )} · ${presetName(catalog, incident.presetId, lang)}`}
                tail={
                  <Badge tone={level.tone}>
                    {level.icon} {level.label}
                  </Badge>
                }
                meta={
                  <>
                    📍 {districts} · 🕒{" "}
                    {relativeTime(incident.capturedAt, now, t)}
                    {" · "}
                    {incident.status === "resolved" ? (
                      <span style={{ color: "var(--ok)" }}>
                        ✅ {t("st_resolved")}
                      </span>
                    ) : incident.publishedAt ? (
                      <span style={{ color: "var(--ok)" }}>
                        📤 {t("st_published")}
                      </span>
                    ) : (
                      <span style={{ color: "var(--warn)" }}>
                        ⏳ {t("st_unpublished")}
                      </span>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
