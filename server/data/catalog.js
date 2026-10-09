/**
 * catalog.js - the master data of Stadtwerke Plattling.
 *
 * Everything a user can pick is defined here: the four utilities, the
 * one-tap presets and the city districts. A different municipality adapts
 * the application by editing this one file.
 */

/**
 * The four utilities the Stadtwerke operate. Further categories can be added
 * at runtime - a gas smell, a street light, a district heating substation -
 * because a real incident does not always fit a pre-made list.
 */
export const SERVICES = {
  strom: {
    id: "strom",
    icon: "⚡",
    name: {
      de: "Strom",
      en: "Electricity",
      fr: "Électricité",
      es: "Electricidad",
    },
  },
  wasser: {
    id: "wasser",
    icon: "💧",
    name: { de: "Wasser", en: "Water", fr: "Eau", es: "Agua" },
  },
  abwasser: {
    id: "abwasser",
    icon: "🚿",
    name: {
      de: "Abwasser",
      en: "Wastewater",
      fr: "Eaux usées",
      es: "Aguas residuales",
    },
  },
  fernwaerme: {
    id: "fernwaerme",
    icon: "🔥",
    name: {
      de: "Fernwärme",
      en: "District heating",
      fr: "Chauffage urbain",
      es: "Calefacción urbana",
    },
  },
};

/** City districts with the number of households, used in the message text. */
export const DISTRICTS = [
  { id: "stadtmitte", name: "Stadtmitte", households: 2100 },
  { id: "nord", name: "Plattling Nord", households: 1400 },
  { id: "sued", name: "Plattling Süd", households: 1250 },
  { id: "pankofen", name: "Pankofen", households: 620 },
  { id: "enzkofen", name: "Enzkofen", households: 310 },
  { id: "altenufer", name: "Altenufer", households: 280 },
  { id: "gewerbe_ost", name: "Gewerbegebiet Ost", households: 140 },
];

/**
 * One-tap presets - the fastest way from "something broke" to a report.
 * planned    : the wording becomes "planned work" instead of "disruption"
 * boilNotice : adds the drinking-water warning to the advice section
 * tone       : how the message should sound, so people stay calm
 *              reassuring - nothing to worry about (planned work)
 *              steady     - factual, the team is already working on it
 *              careful    - serious, but explained calmly (health relevant)
 *              light      - a small inconvenience, no alarm needed
 */
export const PRESETS = [
  {
    id: "strom_ausfall",
    tone: "steady",
    service: "strom",
    icon: "⚡",
    etaMinutes: 120,
    name: {
      de: "Stromausfall",
      en: "Power outage",
      fr: "Panne de courant",
      es: "Corte de luz",
    },
    cause: {
      de: "Kabelschaden im Mittelspannungsnetz",
      en: "Cable fault in the medium-voltage network",
      fr: "Défaut de câble sur le réseau moyenne tension",
      es: "Avería de cable en la red de media tensión",
    },
  },

  {
    id: "strom_wartung",
    tone: "reassuring",
    service: "strom",
    icon: "🔧",
    etaMinutes: 180,
    planned: true,
    name: {
      de: "Geplante Abschaltung",
      en: "Planned shutdown",
      fr: "Coupure planifiée",
      es: "Corte planificado",
    },
    cause: {
      de: "Geplante Wartungsarbeiten am Netz",
      en: "Planned maintenance work on the network",
      fr: "Travaux de maintenance planifiés",
      es: "Trabajos de mantenimiento planificados",
    },
  },

  {
    id: "wasser_rohrbruch",
    tone: "steady",
    service: "wasser",
    icon: "💥",
    etaMinutes: 240,
    name: {
      de: "Rohrbruch",
      en: "Burst pipe",
      fr: "Rupture de canalisation",
      es: "Rotura de tubería",
    },
    cause: {
      de: "Rohrbruch in der Hauptleitung",
      en: "Burst in the main pipe",
      fr: "Rupture de la conduite principale",
      es: "Rotura en la tubería principal",
    },
  },

  {
    id: "wasser_truebung",
    tone: "careful",
    service: "wasser",
    icon: "🧪",
    etaMinutes: 720,
    boilNotice: true,
    name: {
      de: "Trübung / Abkochgebot",
      en: "Turbidity / boil notice",
      fr: "Turbidité / eau à bouillir",
      es: "Turbidez / hervir el agua",
    },
    cause: {
      de: "Trübung im Trinkwassernetz",
      en: "Turbidity in the drinking water network",
      fr: "Turbidité dans le réseau d’eau potable",
      es: "Turbidez en la red de agua potable",
    },
  },

  {
    id: "abwasser_rueckstau",
    tone: "light",
    service: "abwasser",
    icon: "🌧️",
    etaMinutes: 180,
    name: {
      de: "Rückstau / Überlastung",
      en: "Backflow / overload",
      fr: "Refoulement / surcharge",
      es: "Reflujo / sobrecarga",
    },
    cause: {
      de: "Starkregen überlastet die Kanalisation",
      en: "Heavy rain is overloading the sewer system",
      fr: "De fortes pluies saturent le réseau d’assainissement",
      es: "Las lluvias intensas saturan el alcantarillado",
    },
  },

  {
    id: "waerme_ausfall",
    tone: "steady",
    service: "fernwaerme",
    icon: "🔥",
    etaMinutes: 150,
    name: {
      de: "Wärmeausfall",
      en: "Heating failure",
      fr: "Panne de chauffage",
      es: "Fallo de calefacción",
    },
    cause: {
      de: "Störung an der Heizzentrale",
      en: "Fault at the heating plant",
      fr: "Panne à la centrale thermique",
      es: "Avería en la central térmica",
    },
  },
];

/* ---------------------------------------------------------------------------
 * Built-in entries plus the ones the team adds while working.
 *
 * Custom districts and problem types are stored in the database, not in this
 * file, so a new village or a new kind of fault can be added on the phone in
 * the middle of a shift without touching the code or restarting anything.
 * The built-in entries can never be deleted - only custom ones can.
 * ------------------------------------------------------------------------ */

import { all } from "../lib/store.js";

/** Every category: the four built-in utilities plus the added ones. */
export function allServices() {
  const custom = all().customServices || [];
  const merged = { ...SERVICES };
  for (const service of custom) merged[service.id] = service;
  return merged;
}

/** One category by id, whether built in or added. */
export function getService(id) {
  return allServices()[id] || null;
}

/** Every district: the built-in list first, then the added ones. */
export function allDistricts() {
  return [...DISTRICTS, ...(all().customDistricts || [])];
}

/** Every problem type: the built-in presets first, then the added ones. */
export function allPresets() {
  return [...PRESETS, ...(all().customPresets || [])];
}

export const getPreset = (id) => allPresets().find((p) => p.id === id);
export const getDistricts = (ids = []) =>
  ids.map((id) => allDistricts().find((d) => d.id === id)).filter(Boolean);
export const countHouseholds = (ids = []) =>
  getDistricts(ids).reduce((sum, d) => sum + d.households, 0);

/** Turn a name typed by a user into a stable id. */
export function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || `x${Date.now()}`
  );
}
