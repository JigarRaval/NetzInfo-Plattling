/**
 * Footer.jsx - Professional footer component
 *
 * Based on Plattling.de footer design
 */

import React from "react";
import { IconPhone, IconMail, IconMapPin } from "../ui/Icons.jsx";

const FOOTER_STRINGS = {
  de: {
    links_title: "Wichtige Links",
    help: "Hilfe",
    about: "Über uns",
    privacy: "Datenschutz",
    impressum: "Impressum",
    contact: "Kontakt",
    contact_title: "Stadtwerke Plattling",
    hours_title: "Öffnungszeiten:",
    hours_mon_fri: "Montag bis Freitag:",
    hours_time: "08:00 Uhr bis 16:00 Uhr",
    contact_header: "Kontakt:",
    address: "Werkstraße 19, 94447 Plattling",
    phone: "09931 708-0",
    email: "info@stadtwerke-plattling.de",
    service_title: "Service",
    description: "Stadtwerke Plattling - Ihr zuverlässiger Partner für Störungsmeldungen und Information rund um die Strom- und Wasserversorgung.",
    copyright: "Stadtwerke Plattling. Alle Rechte vorbehalten.",
  },
  en: {
    links_title: "Important Links",
    help: "Help",
    about: "About Us",
    privacy: "Privacy",
    impressum: "Imprint",
    contact: "Contact",
    contact_title: "Stadtwerke Plattling",
    hours_title: "Opening Hours:",
    hours_mon_fri: "Monday to Friday:",
    hours_time: "08:00 to 16:00",
    contact_header: "Contact:",
    address: "Werkstraße 19, 94447 Plattling",
    phone: "09931 708-0",
    email: "info@stadtwerke-plattling.de",
    service_title: "Service",
    description: "Stadtwerke Plattling - Your reliable partner for outage reports and information about power and water supply.",
    copyright: "Stadtwerke Plattling. All rights reserved.",
  },
  fr: {
    links_title: "Liens importants",
    help: "Aide",
    about: "À propos",
    privacy: "Confidentialité",
    impressum: "Mentions légales",
    contact: "Contact",
    contact_title: "Stadtwerke Plattling",
    hours_title: "Horaires d'ouverture:",
    hours_mon_fri: "Lundi à vendredi:",
    hours_time: "08:00 à 16:00",
    contact_header: "Contact:",
    address: "Werkstraße 19, 94447 Plattling",
    phone: "09931 708-0",
    email: "info@stadtwerke-plattling.de",
    service_title: "Service",
    description: "Stadtwerke Plattling - Votre partenaire fiable pour les rapports de panne et les informations sur l'alimentation en électricité et en eau.",
    copyright: "Stadtwerke Plattling. Tous droits réservés.",
  },
  es: {
    links_title: "Enlaces importantes",
    help: "Ayuda",
    about: "Sobre nosotros",
    privacy: "Privacidad",
    impressum: "Aviso legal",
    contact: "Contacto",
    contact_title: "Stadtwerke Plattling",
    hours_title: "Horario de atención:",
    hours_mon_fri: "Lunes a viernes:",
    hours_time: "08:00 a 16:00",
    contact_header: "Contacto:",
    address: "Werkstraße 19, 94447 Plattling",
    phone: "09931 708-0",
    email: "info@stadtwerke-plattling.de",
    service_title: "Servicio",
    description: "Stadtwerke Plattling - Su socio confiable para informes de interrupciones e información sobre el suministro de electricidad y agua.",
    copyright: "Stadtwerke Plattling. Todos los derechos reservados.",
  },
};

export default function Footer({ t, go }) {
  // Get language from translation function by checking a key
  const lang = t && t("c_language") === "Sprache" ? "de" :
              t && t("c_language") === "Language" ? "en" :
              t && t("c_language") === "Langue" ? "fr" : "es";
  const strings = FOOTER_STRINGS[lang] || FOOTER_STRINGS.de;

  const handleClick = (e, path) => {
    e.preventDefault();
    if (go) go(path);
  };

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">{strings.links_title}</h3>
          <ul className="footer-links">
            <li><a href="#manual" onClick={(e) => handleClick(e, "manual")}>{strings.help}</a></li>
            <li><a href="#datenschutz" onClick={(e) => handleClick(e, "datenschutz")}>{strings.privacy}</a></li>
            <li><a href="#impressum" onClick={(e) => handleClick(e, "impressum")}>{strings.impressum}</a></li>
            <li><a href="#barrierefreiheit" onClick={(e) => handleClick(e, "barrierefreiheit")}>{t("nav_barrierefreiheit")}</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{strings.contact_title}</h3>
          <div className="footer-info">
            <div className="footer-hours">
              <h4>{strings.hours_title}</h4>
              <p>{strings.hours_mon_fri}</p>
              <p>{strings.hours_time}</p>
            </div>
            
            <div className="footer-contact">
              <h4>{strings.contact_header}</h4>
              <div className="contact-item">
                <IconMapPin size={16} />
                <span>{strings.address}</span>
              </div>
              <div className="contact-item">
                <IconPhone size={16} />
                <span>{strings.phone}</span>
              </div>
              <div className="contact-item">
                <IconMail size={16} />
                <span>{strings.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{strings.service_title}</h3>
          <p className="footer-description">
            {strings.description}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {strings.copyright}
        </p>
      </div>
    </footer>
  );
}
