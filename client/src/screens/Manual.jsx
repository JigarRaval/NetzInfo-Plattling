/**
 * Manual.jsx - the built-in handbook.
 *
 * Reached from the floating button on every screen, so a new user is never
 * stuck. The content lives in i18n/manual.js and is fully translated.
 */

import React from "react";
import { useI18n } from "../i18n/index.jsx";
import { Button, Card } from "../ui/kit.jsx";

export default function Manual({ t, go }) {
  const { manual } = useI18n();

  return (
    <div className="stack">
      <div className="between">
        <h1>❓ {t("nav_manual")}</h1>
        <Button size="sm" variant="ghost" icon="🏠" onClick={() => go("home")}>
          {t("nav_home")}
        </Button>
      </div>

      {manual.map((section) => (
        <Card key={section.title} icon={section.icon} title={section.title}>
          {section.body &&
            section.body.map((paragraph, index) => (
              <p key={index} className="small">
                {paragraph}
              </p>
            ))}
          {section.steps && (
            <ol className="bullets small">
              {section.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          )}
        </Card>
      ))}
    </div>
  );
}
