/**
 * i18n/index.js — language state and the translate function.
 *
 * Provides exactly three things to the rest of the app:
 *   lang      the current language code
 *   setLang   switch language (persisted in localStorage)
 *   t(key, params)  the translated string with {placeholders} filled in
 *
 * t() is strict on purpose: an unknown key returns a visible marker instead
 * of silently printing nothing, so a mistake is caught in development.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS } from './strings.js';
import { MANUAL } from './manual.js';

export const LANGUAGES = [
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'fr', flag: '🇫🇷', label: 'Français' },
  { id: 'es', flag: '🇪🇸', label: 'Español' }
];

const STORAGE_KEY = 'netzinfo-lang';
const I18nContext = createContext(null);

/** Saved choice first, then the browser language, German as the fallback. */
function detectLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGUAGES.some((l) => l.id === saved)) return saved;
  const browser = (navigator.language || 'de').slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.id === browser) ? browser : 'de';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  // Keep the choice and the document language attribute in sync.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, params) => {
    const entry = STRINGS[key];
    if (!entry) return `⟨${key}⟩`;                       // visible, never silent
    const template = entry[lang] || entry.de;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      (params[name] !== undefined ? String(params[name]) : match));
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang: setLangState,
    t,
    manual: MANUAL[lang] || MANUAL.de
  }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Hook used by every component that displays text. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
