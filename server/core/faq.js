/**
 * faq.js — question answering that cannot invent anything.
 *
 * Instead of a language model with world knowledge, a question is matched to
 * an intent by whole-word keywords, and the answer is filled exclusively from
 * the fields of the currently active incidents. Every answer names its source;
 * if nothing matches, the engine says so rather than guessing.
 */

import { SERVICES, getPreset, getDistricts, countHouseholds } from '../data/catalog.js';
import { localTime } from '../lib/time.js';

const INTENTS = [
  { id: 'when',    words: ['wann', 'dauer', 'ende', 'when', 'long', 'quand', 'durée', 'cuándo', 'cuanto'] },
  { id: 'why',     words: ['warum', 'ursache', 'grund', 'why', 'cause', 'pourquoi', 'causa', 'porqué'] },
  { id: 'where',   words: ['wo', 'ortsteil', 'betroffen', 'where', 'area', 'areas', 'où', 'dónde', 'zona'] },
  { id: 'advice',  words: ['tun', 'verhalten', 'tipps', 'do', 'should', 'faire', 'hacer'] },
  { id: 'water',   words: ['trinken', 'abkochen', 'trinkwasser', 'drink', 'boil', 'boire', 'beber', 'hervir'] },
  { id: 'contact', words: ['kontakt', 'telefon', 'anrufen', 'contact', 'phone', 'call', 'téléphone', 'teléfono'] },
  { id: 'status',  words: ['status', 'aktuell', 'störung', 'ausfall', 'outage', 'panne', 'avería', 'averia'] }
];

/** Answer templates. Placeholders are filled from incident fields only. */
const FRAMES = {
  de: {
    when: 'Die Störung ({title}) soll voraussichtlich bis {eta} behoben sein. Beginn: {since}.',
    why: 'Ursache: {cause}.',
    where: 'Betroffen sind: {districts} (rund {households} Haushalte).',
    advice: 'Empfehlung: {advice}',
    water: 'Hinweis zum Trinkwasser: {water}',
    contact: 'Die Störungsannahme der Stadtwerke Plattling erreichen Sie rund um die Uhr unter 09931 / 700-0.',
    status: 'Aktuelle Meldung: {title} in {districts}, seit {since}, voraussichtlich bis {eta}.',
    unknown: 'Dazu liegt mir keine Information aus den aktuellen Störungsmeldungen vor. Bitte wenden Sie sich an die Störungsannahme: 09931 / 700-0.',
    clear: 'Es liegen derzeit keine aktiven Störungen vor. Alle Netze sind in Betrieb.'
  },
  en: {
    when: 'The disruption ({title}) is expected to be fixed by {eta}. It started at {since}.',
    why: 'Cause: {cause}.',
    where: 'Affected areas: {districts} (approx. {households} households).',
    advice: 'Recommendation: {advice}',
    water: 'Drinking water note: {water}',
    contact: 'You can reach the Stadtwerke Plattling service line around the clock on 09931 / 700-0.',
    status: 'Current report: {title} in {districts}, since {since}, expected until {eta}.',
    unknown: 'I have no information on that in the current outage reports. Please contact the service line: 09931 / 700-0.',
    clear: 'There are currently no active outages. All networks are operating normally.'
  },
  fr: {
    when: 'La perturbation ({title}) devrait être résolue vers {eta}. Début : {since}.',
    why: 'Cause : {cause}.',
    where: 'Zones concernées : {districts} (environ {households} foyers).',
    advice: 'Recommandation : {advice}',
    water: 'Remarque sur l’eau potable : {water}',
    contact: 'Le service de dépannage Stadtwerke Plattling est joignable 24h/24 au 09931 / 700-0.',
    status: 'Signalement actuel : {title} à {districts}, depuis {since}, prévu jusqu’à {eta}.',
    unknown: 'Je n’ai aucune information à ce sujet dans les signalements actuels. Contactez le 09931 / 700-0.',
    clear: 'Aucune perturbation active actuellement. Tous les réseaux fonctionnent normalement.'
  },
  es: {
    when: 'Se prevé que la incidencia ({title}) esté resuelta hacia las {eta}. Inicio: {since}.',
    why: 'Causa: {cause}.',
    where: 'Zonas afectadas: {districts} (aprox. {households} hogares).',
    advice: 'Recomendación: {advice}',
    water: 'Nota sobre el agua potable: {water}',
    contact: 'Puede contactar con el servicio de averías de Stadtwerke Plattling las 24 horas en el 09931 / 700-0.',
    status: 'Aviso actual: {title} en {districts}, desde {since}, previsto hasta las {eta}.',
    unknown: 'No dispongo de esa información en los avisos actuales. Contacte con el 09931 / 700-0.',
    clear: 'Actualmente no hay incidencias activas. Todas las redes funcionan con normalidad.'
  }
};

const ADVICE_SHORT = {
  de: { wasser: 'Wasservorrat bereitstellen, Wasserhähne geschlossen halten.', default: 'Bitte die Hinweise in der aktuellen Meldung beachten.' },
  en: { wasser: 'Keep a water supply ready and taps closed.', default: 'Please follow the advice in the current notice.' },
  fr: { wasser: 'Prévoyez une réserve d’eau et gardez les robinets fermés.', default: 'Veuillez suivre les conseils du message actuel.' },
  es: { wasser: 'Tenga una reserva de agua y mantenga los grifos cerrados.', default: 'Siga las recomendaciones del aviso actual.' }
};

const WATER_NOTE = {
  de: { yes: 'Trinkwasser mindestens 3 Minuten abkochen.', no: 'Es besteht kein Abkochgebot.' },
  en: { yes: 'Boil drinking water for at least 3 minutes.', no: 'No boil notice is in place.' },
  fr: { yes: 'Faites bouillir l’eau potable au moins 3 minutes.', no: 'Aucune consigne d’ébullition n’est en vigueur.' },
  es: { yes: 'Hierva el agua potable al menos 3 minutos.', no: 'No hay aviso de hervir el agua.' }
};

/**
 * Whole-word matching. A plain substring search would match "wo" inside
 * "world" and answer a football question with outage data.
 */
function hasWord(question, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'iu').test(question);
}

export function answerQuestion(question, incidents, lang = 'de') {
  const F = FRAMES[lang] || FRAMES.de;
  const active = incidents.filter((i) => i.status !== 'resolved');

  if (active.length === 0) {
    return { answer: F.clear, sources: [], intent: 'status', lang };
  }

  const intent = INTENTS.find((i) => i.words.some((w) => hasWord(question, w)))?.id;
  if (!intent) return { answer: F.unknown, sources: [], intent: null, lang };

  // Most severe incident first, ties broken by recency.
  const RANK = { kritisch: 4, hoch: 3, mittel: 2, niedrig: 1 };
  const inc = [...active].sort((a, b) =>
    (RANK[b.severity] || 0) - (RANK[a.severity] || 0) || b.startedAt.localeCompare(a.startedAt))[0];

  const preset = getPreset(inc.presetId);
  const service = SERVICES[inc.service];
  const values = {
    title: `${service.name[lang] || service.name.de} – ${preset ? (preset.name[lang] || preset.name.de) : ''}`.trim(),
    cause: preset ? (preset.cause[lang] || preset.cause.de) : '',
    districts: getDistricts(inc.districts).map((d) => d.name).join(', '),
    households: String(countHouseholds(inc.districts)),
    since: localTime(inc.startedAt, lang),
    eta: localTime(inc.etaAt, lang),
    advice: (ADVICE_SHORT[lang] || ADVICE_SHORT.de)[inc.service] || (ADVICE_SHORT[lang] || ADVICE_SHORT.de).default,
    water: (WATER_NOTE[lang] || WATER_NOTE.de)[inc.boilNotice ? 'yes' : 'no']
  };

  const answer = (F[intent] || F.unknown).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');

  return {
    answer,
    sources: [{ incidentId: inc.id, presetId: inc.presetId, service: inc.service }],
    intent,
    lang
  };
}
