/**
 * Datenschutz.jsx - Privacy Policy page
 *
 * Required by GDPR (DSGVO) for websites processing personal data.
 * Contains placeholder content that should be replaced with actual legal information.
 */

import React from "react";
import { Card } from "../ui/kit.jsx";
import { IconShield } from "../ui/Icons.jsx";

export default function Datenschutz({ t }) {
  return (
    <div className="stack">
      <Card icon="shield" title={t("ds_title")}>
        <div className="legal-content">
          <section className="legal-section">
            <h3>{t("ds_intro")}</h3>
            <p>{t("ds_intro_text")}</p>
          </section>

          <section className="legal-section">
            <h3>{t("ds_data_collection")}</h3>
            <p>{t("ds_data_collection_text")}</p>
            <ul className="legal-list">
              <li>{t("ds_data_1")}</li>
              <li>{t("ds_data_2")}</li>
              <li>{t("ds_data_3")}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>{t("ds_purpose")}</h3>
            <p>{t("ds_purpose_text")}</p>
          </section>

          <section className="legal-section">
            <h3>{t("ds_retention")}</h3>
            <p>{t("ds_retention_text")}</p>
          </section>

          <section className="legal-section">
            <h3>{t("ds_rights")}</h3>
            <p>{t("ds_rights_text")}</p>
            <ul className="legal-list">
              <li>{t("ds_right_1")}</li>
              <li>{t("ds_right_2")}</li>
              <li>{t("ds_right_3")}</li>
              <li>{t("ds_right_4")}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h3>{t("ds_contact")}</h3>
            <p className="legal-placeholder">
              {t("ds_contact_placeholder")}
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
