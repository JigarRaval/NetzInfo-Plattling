/**
 * main.jsx — entry point.
 *
 * Mounts React inside the language provider and registers the service worker
 * that makes the app installable on a phone.
 * StrictMode is intentionally not used: it double-invokes effects in
 * development, which makes the live timers tick twice.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n/index.jsx';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is optional */ });
  });
}
