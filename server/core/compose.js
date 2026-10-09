/**
 * compose.js - writes the citizen-facing message in four languages.
 *
 * Four things drive the result:
 *
 *   1. THE STATE    first notice / update / all clear. Each one gets its own
 *      headline word and its own body, so a reader sees in half a second
 *      whether something started, is still running, or is over.
 *
 *   2. THE TONE     reassuring / steady / careful / light. The facts never
 *      change, the wording does - and it changes throughout the message, not
 *      only in the last line: the opening sentence, the line that explains
 *      what it means for the reader, and the closing sentence all follow the
 *      tone. A planned shutdown must not read like an emergency.
 *
 *   3. THE VARIANT  a number. Every sentence slot has several phrasings, so
 *      "write the text again" really produces a different text instead of
 *      the same words twice. Facts are untouched by this.
 *
 *   4. THE SCREEN   people read this on a phone, standing up. Short lines,
 *      one fact per line, a list for the advice, no decoration.
 */

import {
  getService,
  getPreset,
  getDistricts,
  countHouseholds,
} from "../data/catalog.js";
import { localTime } from "../lib/time.js";

export const LANGUAGES = ["de", "en", "fr", "es"];

/** Rotate through the phrasings of one slot. */
const pick = (list, variant) =>
  list[Math.abs(Number(variant) || 0) % list.length];

/* -------------------------------------------------------------- the states */
const STATE = {
  de: {
    first: "Störung",
    planned: "Geplante Arbeiten",
    update: "Update",
    allclear: "Entwarnung",
  },
  en: {
    first: "Outage",
    planned: "Planned work",
    update: "Update",
    allclear: "All clear",
  },
  fr: {
    first: "Panne",
    planned: "Travaux planifiés",
    update: "Mise à jour",
    allclear: "Fin d’alerte",
  },
  es: {
    first: "Incidencia",
    planned: "Trabajos planificados",
    update: "Actualización",
    allclear: "Todo resuelto",
  },
};

/* ----------------------------------------------------- labels for the facts */
const WORDS = {
  de: {
    since: "Seit",
    until: "Voraussichtlich bis",
    newEstimate: "Neue Einschätzung",
    fixedAt: "Behoben um",
    affected: "Betroffen",
    households: "rund {n} Haushalte",
    radius: "Betroffener Radius",
  },
  en: {
    since: "Since",
    until: "Expected until",
    newEstimate: "New estimate",
    fixedAt: "Fixed at",
    affected: "Affected",
    households: "about {n} households",
    radius: "Affected radius",
  },
  fr: {
    since: "Depuis",
    until: "Prévu jusqu'à",
    newEstimate: "Nouvelle estimation",
    fixedAt: "Rétabli à",
    affected: "Concernés",
    households: "environ {n} foyers",
    radius: "Rayon affecté",
  },
  es: {
    since: "Desde",
    until: "Previsto hasta",
    newEstimate: "Nueva previsión",
    fixedAt: "Resuelto a las",
    affected: "Afectados",
    households: "unos {n} hogares",
    radius: "Radio afectado",
  },
};

/* ------------------------------- the opening sentence, per state and variant */
const OPENING = {
  de: {
    first: [
      "Die Versorgung mit {s} ist derzeit unterbrochen.",
      "Es liegt eine Störung in der Versorgung mit {s} vor.",
      "Aktuell kommt es zu einer Störung bei {s}.",
    ],
    update: [
      "Die Arbeiten an der {s}-Versorgung dauern noch an.",
      "Hier der aktuelle Stand zur Störung bei {s}.",
      "Wir arbeiten weiterhin an der Störung bei {s}.",
    ],
    allclear: [
      "Die Versorgung mit {s} läuft wieder normal.",
      "Die Störung bei {s} ist behoben.",
      "Alle Anschlüsse werden wieder mit {s} versorgt.",
    ],
  },
  en: {
    first: [
      "The {s} supply is currently interrupted.",
      "There is a disruption to the {s} supply.",
      "We are currently seeing a fault in the {s} supply.",
    ],
    update: [
      "Work on the {s} supply is still going on.",
      "Here is the current status of the {s} disruption.",
      "We are still working on the {s} fault.",
    ],
    allclear: [
      "The {s} supply is working normally again.",
      "The disruption to the {s} supply has been fixed.",
      "All connections are supplied with {s} again.",
    ],
  },
  fr: {
    first: [
      "L’approvisionnement en {s} est actuellement interrompu.",
      "Une perturbation affecte l’approvisionnement en {s}.",
      "Nous constatons actuellement une panne sur le réseau {s}.",
    ],
    update: [
      "Les travaux sur le réseau {s} sont toujours en cours.",
      "Voici le point actuel sur la panne de {s}.",
      "Nous travaillons toujours sur la panne de {s}.",
    ],
    allclear: [
      "L’approvisionnement en {s} fonctionne de nouveau normalement.",
      "La panne de {s} est résolue.",
      "Tous les raccordements sont de nouveau alimentés en {s}.",
    ],
  },
  es: {
    first: [
      "El suministro de {s} está interrumpido en este momento.",
      "Existe una interrupción en el suministro de {s}.",
      "Actualmente hay una avería en el suministro de {s}.",
    ],
    update: [
      "Los trabajos en la red de {s} continúan.",
      "Este es el estado actual de la avería de {s}.",
      "Seguimos trabajando en la avería de {s}.",
    ],
    allclear: [
      "El suministro de {s} vuelve a funcionar con normalidad.",
      "La avería de {s} se ha resuelto.",
      "Todas las conexiones vuelven a tener {s}.",
    ],
  },
};

/**
 * The sentence that says what this means for the reader. This is where the
 * tone becomes audible, right at the top, instead of only at the very end.
 */
const TONE_LEAD = {
  de: {
    reassuring: [
      "Das ist eine geplante Maßnahme.",
      "Diese Arbeiten sind angekündigt und vorbereitet.",
    ],
    steady: [
      "Unser Team ist bereits informiert.",
      "Die Störungsbehebung läuft.",
    ],
    careful: [
      "Bitte lesen Sie die folgenden Hinweise aufmerksam.",
      "Diese Meldung betrifft Ihre Gesundheit, bitte beachten Sie die Hinweise.",
    ],
    light: [
      "Die Einschränkung ist voraussichtlich klein.",
      "Es handelt sich um eine kleinere Beeinträchtigung.",
    ],
  },
  en: {
    reassuring: [
      "This is planned work.",
      "These works were announced and prepared.",
    ],
    steady: [
      "Our team has already been informed.",
      "Repair work is under way.",
    ],
    careful: [
      "Please read the following advice carefully.",
      "This notice concerns your health, please follow the advice.",
    ],
    light: [
      "The disruption is expected to be small.",
      "This is a minor inconvenience.",
    ],
  },
  fr: {
    reassuring: [
      "Il s’agit de travaux planifiés.",
      "Ces travaux étaient annoncés et préparés.",
    ],
    steady: ["Notre équipe est déjà informée.", "La réparation est en cours."],
    careful: [
      "Merci de lire attentivement les consignes suivantes.",
      "Ce message concerne votre santé, suivez les consignes.",
    ],
    light: ["La gêne devrait rester faible.", "Il s’agit d’une gêne mineure."],
  },
  es: {
    reassuring: [
      "Se trata de trabajos planificados.",
      "Estos trabajos estaban anunciados y preparados.",
    ],
    steady: [
      "Nuestro equipo ya está informado.",
      "La reparación está en marcha.",
    ],
    careful: [
      "Lea con atención las siguientes indicaciones.",
      "Este aviso afecta a su salud, siga las indicaciones.",
    ],
    light: [
      "La molestia será previsiblemente pequeña.",
      "Se trata de una molestia menor.",
    ],
  },
};

/* ------------------------------------------- the heading above the advice */
const ADVICE_TITLE = {
  de: ["Was Sie jetzt tun können", "Unsere Empfehlung", "Bitte beachten Sie"],
  en: ["What you can do now", "Our recommendation", "Please note"],
  fr: ["Ce que vous pouvez faire", "Notre recommandation", "À noter"],
  es: ["Qué puede hacer ahora", "Nuestra recomendación", "Tenga en cuenta"],
};

/* ------------------------------------------------- the closing sentence */
const CLOSING = {
  de: {
    reassuring: [
      "Es besteht kein Grund zur Sorge.",
      "Danke für Ihr Verständnis.",
    ],
    steady: [
      "Wir informieren Sie, sobald sich etwas ändert.",
      "Wir arbeiten daran und melden uns wieder.",
    ],
    careful: [
      "Diese Hinweise dienen ausschließlich Ihrer Sicherheit.",
      "Bitte halten Sie sich an die Hinweise, bis wir Entwarnung geben.",
    ],
    light: ["Danke für Ihr Verständnis.", "Wir halten Sie auf dem Laufenden."],
    allclear: [
      "Vielen Dank für Ihre Geduld.",
      "Danke, dass Sie mitgedacht haben.",
    ],
  },
  en: {
    reassuring: [
      "There is no reason for concern.",
      "Thank you for your understanding.",
    ],
    steady: [
      "We will let you know as soon as anything changes.",
      "We are working on it and will report back.",
    ],
    careful: [
      "This advice is purely a precaution for your safety.",
      "Please follow it until we give the all clear.",
    ],
    light: ["Thank you for your understanding.", "We will keep you posted."],
    allclear: [
      "Thank you for your patience.",
      "Thank you for bearing with us.",
    ],
  },
  fr: {
    reassuring: [
      "Il n’y a aucune raison de s’inquiéter.",
      "Merci de votre compréhension.",
    ],
    steady: [
      "Nous vous informerons dès qu’il y aura du nouveau.",
      "Nous y travaillons et reviendrons vers vous.",
    ],
    careful: [
      "Ces consignes visent uniquement votre sécurité.",
      "Merci de les suivre jusqu’à la fin de l’alerte.",
    ],
    light: ["Merci de votre compréhension.", "Nous vous tenons informés."],
    allclear: ["Merci de votre patience.", "Merci d’avoir patienté avec nous."],
  },
  es: {
    reassuring: [
      "No hay motivo de preocupación.",
      "Gracias por su comprensión.",
    ],
    steady: [
      "Le informaremos en cuanto haya novedades.",
      "Seguimos trabajando y volveremos a informar.",
    ],
    careful: [
      "Estas indicaciones son solo una precaución para su seguridad.",
      "Sígalas hasta que demos el aviso de fin.",
    ],
    light: ["Gracias por su comprensión.", "Le mantendremos informado."],
    allclear: [
      "Gracias por su paciencia.",
      "Gracias por su paciencia con nosotros.",
    ],
  },
};

/* ------------------------------------------- practical advice per utility */
const ADVICE = {
  strom: {
    de: [
      "Empfindliche Geräte vom Netz trennen",
      "Kühl- und Gefriergeräte geschlossen halten",
      "Aufzüge nicht benutzen",
    ],
    en: [
      "Unplug sensitive devices",
      "Keep fridges and freezers closed",
      "Do not use lifts",
    ],
    fr: [
      "Débranchez les appareils sensibles",
      "Gardez réfrigérateurs et congélateurs fermés",
      "N’utilisez pas les ascenseurs",
    ],
    es: [
      "Desconecte los aparatos sensibles",
      "Mantenga cerrados frigoríficos y congeladores",
      "No utilice los ascensores",
    ],
  },
  wasser: {
    de: [
      "Wasservorrat zum Trinken und Kochen bereitstellen",
      "Wasserhähne geschlossen halten",
      "Nach der Störung Leitungen kurz durchspülen",
    ],
    en: [
      "Keep water ready for drinking and cooking",
      "Keep taps closed",
      "Flush the pipes briefly afterwards",
    ],
    fr: [
      "Prévoyez de l’eau pour boire et cuisiner",
      "Gardez les robinets fermés",
      "Purgez brièvement les conduites ensuite",
    ],
    es: [
      "Tenga agua para beber y cocinar",
      "Mantenga los grifos cerrados",
      "Purgue brevemente las tuberías después",
    ],
  },
  abwasser: {
    de: [
      "Waschmaschine und Spülmaschine vorerst nicht nutzen",
      "Kellerabläufe im Blick behalten",
      "Keine Feuchttücher in die Toilette",
    ],
    en: [
      "Avoid washing machines and dishwashers for now",
      "Keep an eye on basement drains",
      "Do not flush wet wipes",
    ],
    fr: [
      "Évitez lave-linge et lave-vaisselle",
      "Surveillez les siphons de cave",
      "Ne jetez pas de lingettes",
    ],
    es: [
      "Evite la lavadora y el lavavajillas",
      "Vigile los desagües del sótano",
      "No tire toallitas al inodoro",
    ],
  },
  fernwaerme: {
    de: [
      "Türen und Fenster geschlossen halten",
      "Heizkörper aufgedreht lassen",
      "Bei Bedarf Nachbarschaftshilfe anbieten",
    ],
    en: [
      "Keep doors and windows closed",
      "Leave radiators turned on",
      "Offer help to neighbours if needed",
    ],
    fr: [
      "Gardez portes et fenêtres fermées",
      "Laissez les radiateurs ouverts",
      "Proposez de l’aide aux voisins",
    ],
    es: [
      "Mantenga puertas y ventanas cerradas",
      "Deje los radiadores abiertos",
      "Ofrezca ayuda a los vecinos",
    ],
  },
};

/** The drinking-water warning always comes first and is never rephrased. */
const BOIL = {
  de: "Wichtig: Trinkwasser vor dem Verbrauch mindestens 3 Minuten abkochen",
  en: "Important: boil drinking water for at least 3 minutes before use",
  fr: "Important : faites bouillir l’eau potable au moins 3 minutes",
  es: "Importante: hierva el agua potable al menos 3 minutos",
};

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

/**
 * Compose one message.
 * @param {object} incident structured incident
 * @param {'first'|'update'|'allclear'} kind
 * @param {'de'|'en'|'fr'|'es'} lang
 * @param {number} variant which phrasing to use; the facts never change
 */
export function compose(incident, kind = "first", lang = "de", variant = 0) {
  const L = WORDS[lang] || WORDS.de;
  const states = STATE[lang] || STATE.de;
  const v = Number(variant) || 0;

  const service = getService(incident.service);
  const serviceName = service
    ? service.name[lang] || service.name.de
    : incident.service;
  const preset = getPreset(incident.presetId);

  const districts = getDistricts(incident.districts);
  const districtList = districts.map((d) => d.name).join(", ");
  const households = countHouseholds(incident.districts);

  const stateKey = kind === "first" && incident.planned ? "planned" : kind;
  const stateWord = states[stateKey] || states.first;
  const headline = `${stateWord}: ${serviceName}`;

  // The tone: chosen by hand on the Send screen, otherwise from the preset.
  const tone =
    kind === "allclear"
      ? "allclear"
      : incident.toneOverride || preset?.tone || "steady";

  // --- the sentences that carry the tone and the variant -----------------
  const opening = pick(
    (OPENING[lang] || OPENING.de)[kind] || OPENING.de.first,
    v
  ).replace("{s}", serviceName);
  const toneLead =
    kind === "allclear"
      ? ""
      : pick((TONE_LEAD[lang] || TONE_LEAD.de)[tone] || TONE_LEAD.de.steady, v);
  const adviceTitle = pick(ADVICE_TITLE[lang] || ADVICE_TITLE.de, v);
  const closing = pick(
    (CLOSING[lang] || CLOSING.de)[tone] || CLOSING.de.steady,
    v
  );

  const cause = preset ? preset.cause[lang] || preset.cause.de : "";

  // --- the message --------------------------------------------------------
  const lines = [];
  lines.push(headline);
  lines.push(districtList + (incident.street ? ` (${incident.street})` : ""));
  lines.push("");

  lines.push(opening);
  if (toneLead) lines.push(toneLead);
  if (cause && kind !== "allclear") lines.push(`${cause}.`);
  lines.push("");

  if (kind === "allclear") {
    lines.push(
      `${L.fixedAt}: ${localTime(
        incident.resolvedAt || new Date().toISOString(),
        lang
      )}`
    );
  } else {
    lines.push(`${L.since}: ${localTime(incident.startedAt, lang)}`);
    lines.push(
      `${kind === "update" ? L.newEstimate : L.until}: ${localTime(
        incident.etaAt,
        lang
      )}`
    );
    if (households > 0)
      lines.push(`${L.affected}: ${L.households.replace("{n}", households)}`);
    if (incident.radiusMeters) {
      const radiusKm = (incident.radiusMeters / 1000).toFixed(1);
      lines.push(`${L.radius}: ${radiusKm} km`);
    }
  }

  const tips =
    kind === "allclear" ? [] : [...(ADVICE[incident.service]?.[lang] || [])];
  if (incident.boilNotice && kind !== "allclear") tips.unshift(BOIL[lang]);

  if (tips.length > 0) {
    lines.push("");
    lines.push(`${adviceTitle}:`);
    tips.forEach((tip) => lines.push(`- ${tip}`));
  }

  lines.push("");
  lines.push(closing);

  const text = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const short =
    kind === "allclear"
      ? `${stateWord} ${serviceName}: ${districtList}. ${opening}`
      : `${stateWord} ${serviceName}: ${districtList}. ${L.until} ${localTime(
          incident.etaAt,
          lang
        )}.`;

  const html = buildHtml({
    headline,
    districtList,
    street: incident.street,
    kind,
    L,
    opening,
    toneLead,
    cause,
    incident,
    households,
    adviceTitle,
    tips,
    closing,
    lang,
  });

  const sections = [
    { key: "head", body: headline },
    { key: "where", body: districtList },
    { key: "what", body: `${opening} ${toneLead} ${cause}`.trim() },
    {
      key: "when",
      body:
        kind === "allclear"
          ? localTime(incident.resolvedAt || new Date().toISOString(), lang)
          : `${localTime(incident.startedAt, lang)} ${localTime(
              incident.etaAt,
              lang
            )}`,
    },
    { key: "advice", body: tips.join(" ") },
    { key: "closing", body: closing },
  ].filter((s) => s.body);

  return {
    title: `${headline} – ${districtList}`,
    state: stateKey,
    tone,
    variant: v,
    sections,
    text,
    short,
    html,
  };
}

/** The same message as clean HTML, in the structure the platform accepts. */
function buildHtml({
  headline,
  districtList,
  street,
  kind,
  L,
  opening,
  toneLead,
  cause,
  incident,
  households,
  adviceTitle,
  tips,
  closing,
  lang,
}) {
  const parts = [];
  parts.push(`<h3>${esc(headline)}</h3>`);
  parts.push(
    `<p><strong>${esc(districtList)}</strong>${
      street ? ` (${esc(street)})` : ""
    }</p>`
  );

  const intro = [
    opening,
    toneLead,
    cause && kind !== "allclear" ? `${cause}.` : "",
  ].filter(Boolean);
  parts.push(`<p>${intro.map(esc).join("<br>")}</p>`);

  if (kind === "allclear") {
    parts.push(
      `<p>${esc(L.fixedAt)}: ${esc(
        localTime(incident.resolvedAt || new Date().toISOString(), lang)
      )}</p>`
    );
  } else {
    parts.push(
      `<p>${esc(L.since)}: ${esc(localTime(incident.startedAt, lang))}<br>` +
        `${esc(kind === "update" ? L.newEstimate : L.until)}: ${esc(
          localTime(incident.etaAt, lang)
        )}` +
        (households > 0
          ? `<br>${esc(L.affected)}: ${esc(
              L.households.replace("{n}", households)
            )}`
          : "") +
        (incident.radiusMeters
          ? `<br>${esc(L.radius)}: ${esc(
              (incident.radiusMeters / 1000).toFixed(1)
            )} km`
          : "") +
        "</p>"
    );
  }

  if (tips.length > 0) {
    parts.push(`<p><strong>${esc(adviceTitle)}</strong></p>`);
    parts.push(
      `<ul>${tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>`
    );
  }

  parts.push(`<p>${esc(closing)}</p>`);
  return parts.join("\n");
}

/**
 * Turn a hand-edited plain text back into the HTML the platform expects.
 *
 * Needed because a manual edit changes the text, and the post that goes to
 * Heimat-Info must show exactly what was approved - not the original
 * template. Only h3, p and ul are produced; script and iframe are forbidden
 * by the platform and simply cannot occur here.
 */
export function textToHtml(text) {
  const lines = String(text).split("\n");
  const parts = [];
  let bullets = [];

  const flush = () => {
    if (bullets.length) {
      parts.push(
        `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      );
      bullets = [];
    }
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) {
      flush();
      return;
    }
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      return;
    }
    flush();
    if (index === 0) parts.push(`<h3>${esc(line)}</h3>`);
    else parts.push(`<p>${esc(line)}</p>`);
  });
  flush();

  return parts.join("\n");
}

/** Compose the message in all four languages at once. */
export function composeAll(incident, kind, variant = 0) {
  return Object.fromEntries(
    LANGUAGES.map((lang) => [lang, compose(incident, kind, lang, variant)])
  );
}

/** A formal press release for the editorial system. */
export function composePressRelease(incident, kind, variant = 0) {
  const message = compose(incident, kind, "de", variant);
  const stamp = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return [
    "PRESSEMITTEILUNG – Stadtwerke Plattling",
    `Plattling, ${stamp}`,
    "",
    message.text,
    "",
    "Rückfragen: Pressestelle der Stadtwerke Plattling",
  ].join("\n");
}
