/**
 * Impressum.jsx - Legal Impressum page
 *
 * Required by German law (TMG) for all commercial websites.
 * Contains placeholder content that should be replaced with actual legal information.
 */

import React from "react";
import { Card } from "../ui/kit.jsx";
import { IconBuilding } from "../ui/Icons.jsx";

export default function Impressum({ t }) {
  return (
    <div className="stack">
      <Card icon="building" title={t("im_title")}>
        <div className="legal-content">
          <section className="legal-section">
            <h3>{t("im_provider")}</h3>
            <p className="legal-placeholder">
              {t("im_provider_placeholder")}
            </p>
            <p className="legal-placeholder">
              {t("im_address_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("im_contact")}</h3>
            <p className="legal-placeholder">
              {t("im_contact_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("im_representative")}</h3>
            <p className="legal-placeholder">
              {t("im_representative_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("im_register")}</h3>
            <p className="legal-placeholder">
              {t("im_register_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("im_vat")}</h3>
            <p className="legal-placeholder">
              {t("im_vat_placeholder")}
            </p>
          </section>

          <section className="legal-section">
            <h3>{t("im_responsible")}</h3>
            <p className="legal-placeholder">
              {t("im_responsible_placeholder")}
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
