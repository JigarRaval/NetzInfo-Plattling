/**
 * Public.jsx — what a citizen sees.
 *
 * Exactly the same content that goes into the RSS feed, the city widget and
 * the Heimat-Info post. The message text itself changes with the language
 * dropdown because the server generated it in all four languages.
 */

import React, { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Badge, Button, Card, Empty, Field, Item } from "../ui/kit.jsx";
// Note: RSS / widget / JSON links deliberately do NOT appear here. They are
// outputs for other systems, not something a citizen should be offered; they
// live in the staff area under "Developer tools".
import { DistrictMap } from "../ui/DistrictMap.jsx";
import {
  clockTime,
  presetName,
  relativeTime,
  serviceIcon,
  serviceName,
  severity,
} from "../lib/format.js";

export default function Public({ t, lang, now, catalog }) {
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  const load = useCallback(() => {
    api
      .status(lang)
      .then(setData)
      .catch(() => {});
  }, [lang]);

  // Reload when the language changes, then every 30 seconds while open.
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    try {
      setAnswer(await api.ask(question, lang));
    } catch {
      setAnswer(null);
    } finally {
      setAsking(false);
    }
  }

  if (!data) return <p className="loading">{t("c_loading")}</p>;

  const affected = data.active.flatMap((item) =>
    item.districts.map((d) => d.id)
  );

  return (
    <div className="stack">
      <div>
        <h1>👥 {t("pb_title")}</h1>
        <p className="muted small">{t("pb_sub")}</p>
      </div>

      {/* ------------------------------------------- active incidents --- */}
      {data.active.length === 0 && (
        <Card>
          <Empty icon="✅">{t("pb_all_ok")}</Empty>
        </Card>
      )}

      {data.active.map((item) => {
        const level = severity(t, item.severity);
        return (
          <Card
            key={item.id}
            icon={serviceIcon(catalog, item.service)}
            title={`${serviceName(catalog, item.service, lang)} · ${presetName(
              catalog,
              item.presetId,
              lang
            )}`}
            tail={
              <Badge tone={level.tone}>
                {level.icon} {level.label}
              </Badge>
            }
          >
            <p className="small muted" style={{ marginTop: -6 }}>
              📍 {item.districts.map((d) => d.name).join(", ")} · 🕒{" "}
              {t("pb_since")} {clockTime(item.startedAt, lang)}
              {" · "}⏳ {t("pb_until")} {clockTime(item.etaAt, lang)}
              {item.updateCount > 1 &&
                ` · 🔄 ${t("pb_updates", { n: item.updateCount })}`}
            </p>
            <pre className="message">{item.text}</pre>
            <p className="xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
              📤 {t("pb_published")} {relativeTime(item.publishedAt, now, t)}
            </p>
          </Card>
        );
      })}

      {/* ------------------------------------------------------- map ---- */}
      <Card icon="🗺️" title={t("pb_map_title")} subtitle={t("pb_map_hint")}>
        <DistrictMap
          districts={catalog.districts}
          affected={affected}
          label={t("pb_map_title")}
        />
      </Card>

      {/* --------------------------------------------- ask a question --- */}
      <Card icon="💬" title={t("pb_ask_title")} subtitle={t("pb_scope")}>
        <form onSubmit={ask}>
          <Field htmlFor="question">
            <input
              id="question"
              type="text"
              value={question}
              placeholder={t("pb_ask_ph")}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </Field>
          <Button icon="❓" type="submit" disabled={asking}>
            {asking ? t("c_loading") : t("pb_ask_btn")}
          </Button>
        </form>

        {answer && (
          <div style={{ marginTop: 16 }}>
            <pre className="message">{answer.answer}</pre>
            {answer.sources.length > 0 && (
              <p className="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>
                📎 {t("pb_source")}:{" "}
                {answer.sources
                  .map(
                    (s) =>
                      `${presetName(catalog, s.presetId, lang)} (${
                        s.incidentId
                      })`
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ------------------------------------------ resolved incidents -- */}
      {data.resolved.length > 0 && (
        <Card icon="📜" title={t("pb_resolved")}>
          <div className="list">
            {data.resolved.map((item) => (
              <Item
                key={item.id}
                icon={serviceIcon(catalog, item.service)}
                title={`${serviceName(
                  catalog,
                  item.service,
                  lang
                )} · ${item.districts.map((d) => d.name).join(", ")}`}
                meta={`✅ ${relativeTime(
                  item.resolvedAt || item.publishedAt,
                  now,
                  t
                )}`}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
