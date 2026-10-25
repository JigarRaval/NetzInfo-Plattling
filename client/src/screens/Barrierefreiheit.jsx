/**
 * Barrierefreiheit.jsx - Accessibility Statement page
 *
 * Required by German law (BITV 2.0) for public sector websites.
 * Contains placeholder content that should be replaced with actual accessibility information.
 */

import React from "react";
import { Card } from "../ui/kit.jsx";
import { IconCheck } from "../ui/Icons.jsx";

export default function Barrierefreiheit({ t }) {
  return (
    <div className="stack">
      <Card icon="check" title={t("bf_title")}>
        <div className="legal-content">
          <section className="legal-section">
            <h3>{t("bf_intro")}</h3>
            <p>{t("bf_intro_text")}</p>
          </section>

          <section className="legal-section">
            <h3>{t("bf_compliance")}</h3>
            <p>{t("bf_compliance_text")}</p>
            <p className="legal-placeholder">
              {t("bf_compliance_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("bf_limitations")}</h3>
            <p>{t("bf_limitations_text")}</p>
            <ul className="legal-list">
              <li>{t("bf_limitation_1")}</li>
              <li>{t("bf_limitation_2")}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>{t("bf_created")}</h3>
            <p className="legal-placeholder">
              {t("bf_created_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("bf_reviewed")}</h3>
            <p className="legal-placeholder">
              {t("bf_reviewed_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("bf_feedback")}</h3>
            <p>{t("bf_feedback_text")}</p>
            <p className="legal-placeholder">
              {t("bf_feedback_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("bf_enforcement")}</h3>
            <p>{t("bf_enforcement_text")}</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
