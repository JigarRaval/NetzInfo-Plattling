/**
 * App.jsx - shell, routing and the state shared by the screens.
 *
 * Three screens only, in the order of the daily workflow:
 *   Home   - what is running, and the all-clear button
 *   Report - create a new outage notice
 *   Send   - read the generated text and send it
 * The handbook sits on a floating button so it is always one tap away
 * without taking a place in the navigation.
 *
 * Routing uses the URL hash, so no router library is needed and the app
 * still works when opened from a home-screen shortcut.
 */

import React, { useCallback, useEffect, useState } from "react";
import { api, enablePush, getToken, setToken } from "./lib/api.js";
import { useI18n, LANGUAGES } from "./i18n/index.jsx";
import { Toast, renderIcon } from "./ui/kit.jsx";
import { LogoMark } from "./ui/Logo.jsx";
import {
  IconBell,
  IconBellOff,
  IconSun,
  IconMoon,
  IconLock,
  IconMegaphone,
  IconHelp,
  IconHome,
  IconEdit,
  IconArrowRight,
  IconUser,
  IconSettings,
  IconLogout,
  IconBuilding,
  IconShield,
  IconCheck,
} from "./ui/Icons.jsx";

import Home from "./screens/Home.jsx";
import Report from "./screens/Report.jsx";
import Send from "./screens/Send.jsx";
import Manual from "./screens/Manual.jsx";
import Login from "./screens/Login.jsx";
import Profile from "./screens/Profile.jsx";
import IncidentDetail from "./screens/IncidentDetail.jsx";
import Impressum from "./screens/Impressum.jsx";
import Datenschutz from "./screens/Datenschutz.jsx";
import Barrierefreiheit from "./screens/Barrierefreiheit.jsx";
import Footer from "./ui/Footer.jsx";

const TABS = [
  {
    id: "home",
    icon: <IconHome size={20} />,
    labelKey: "nav_home",
    Screen: Home,
  },
  {
    id: "report",
    icon: <IconEdit size={20} />,
    labelKey: "nav_report",
    Screen: Report,
  },
  {
    id: "send",
    icon: <IconArrowRight size={20} />,
    labelKey: "nav_send",
    Screen: Send,
  },
];

const SCREENS = [
  ...TABS,
  {
    id: "profile",
    icon: <IconUser size={20} />,
    labelKey: "nav_profile",
    Screen: Profile,
  },
  {
    id: "manual",
    icon: <IconHelp size={20} />,
    labelKey: "nav_manual",
    Screen: Manual,
  },
  {
    id: "impressum",
    icon: <IconBuilding size={20} />,
    labelKey: "nav_impressum",
    Screen: Impressum,
  },
  {
    id: "datenschutz",
    icon: <IconShield size={20} />,
    labelKey: "nav_datenschutz",
    Screen: Datenschutz,
  },
  {
    id: "barrierefreiheit",
    icon: <IconCheck size={20} />,
    labelKey: "nav_barrierefreiheit",
    Screen: Barrierefreiheit,
  },
];

const routeFromHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, "");
  // Handle incident detail routes: #/incident/:id
  if (hash.startsWith("incident/")) {
    return "incident";
  }
  return SCREENS.some((s) => s.id === hash) ? hash : "home";
};

export default function App() {
  const { t, lang, setLang } = useI18n();

  const [route, setRoute] = useState(routeFromHash);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("stadtwerke-theme") || "light"
  );
  const [catalog, setCatalog] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [toast, setToast] = useState("");

  // Session: writing needs a PIN, reading does not. `authReady` prevents a
  // flash of the login screen while we are still asking the server.
  const [authRequired, setAuthRequired] = useState(false);
  const [signedIn, setSignedIn] = useState(Boolean(getToken()));
  const [authReady, setAuthReady] = useState(false);
  const [pushOn, setPushOn] = useState(
    () => localStorage.getItem("stadtwerke-push") === "on"
  );
  const [workers, setWorkers] = useState([]); // who can be on shift
  const [worker, setWorker] = useState(null); // who is on shift now
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showUserMenu && !event.target.closest(".user-menu-wrapper")) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showNotifications]);

  /** Unknown ids fall back to the home screen, so a bad link cannot blank the app. */
  const go = useCallback((id) => {
    const target = SCREENS.some((s) => s.id === id) ? id : "home";
    window.location.hash = `#/${target}`;
    setRoute(target);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    localStorage.setItem("stadtwerke-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const notify = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [incidentRows, draftRows] = await Promise.all([
        api.incidents(),
        api.drafts(),
      ]);
      setIncidents(incidentRows);
      setDrafts(draftRows);
    } catch {
      notify(t("c_offline"));
    }
  }, [notify, t]);

  /** Reload the master data after the team added a problem type or a place. */
  const reloadCatalog = useCallback(
    () =>
      api
        .catalog()
        .then(setCatalog)
        .catch(() => {}),
    []
  );

  /**
   * Decide what to show before anything is drawn.
   *
   * A token left in localStorage is not proof of a session - it may have
   * expired, or the server may have been restarted. It is therefore checked
   * against the server first. Until that answer arrives nothing is rendered,
   * so the interface can never flash up in front of somebody who still has
   * to enter the PIN.
   */
  useEffect(() => {
    (async () => {
      try {
        const state = await api.authState();
        setAuthRequired(state.required);
        setWorkers(state.workers || []);

        if (state.required) {
          if (getToken()) {
            try {
              await api.verify();
              setSignedIn(true);
              // The server knows who this token belongs to.
              const after = await api.authState();
              setWorker(after.worker || null);
            } catch {
              setToken("");
              setSignedIn(false);
            }
          } else {
            setSignedIn(false);
          }
        }
      } catch {
        notify(t("c_offline"));
      } finally {
        setAuthReady(true);
      }
    })();
  }, [notify, t]);

  // The data is only fetched once we know the session is good.
  useEffect(() => {
    if (!authReady || (authRequired && !signedIn)) return;
    api
      .catalog()
      .then(setCatalog)
      .catch(() => notify(t("c_offline")));
    refresh();
  }, [authReady, authRequired, signedIn, refresh, notify, t]);

  /** Turn on system notifications for this device. */
  async function turnOnPush() {
    const result = await enablePush();
    if (result.ok) {
      localStorage.setItem("stadtwerke-push", "on");
      setPushOn(true);
      notify(t("ps_on"));
    } else {
      notify(t(result.reason === "denied" ? "ps_denied" : "ps_unsupported"));
    }
  }

  async function signOut() {
    try {
      await api.updateLastLogin();
    } catch (err) {
      console.error("Failed to update last login:", err);
    }
    api.logout().catch(() => {});
    setToken("");
    setSignedIn(false);
    setWorker(null);
  }

  // Nothing at all until we know whether a login is needed.
  if (!authReady) {
    return (
      <div className="splash">
        <LogoMark size={54} />
        <p>{t("c_loading")}</p>
      </div>
    );
  }

  // Always require login to access the application
  if (!signedIn) {
    return (
      <Login
        t={t}
        workers={workers}
        onDone={(signedInWorker) => {
          setWorker(signedInWorker || null);
          setSignedIn(true);
          refresh();
        }}
      />
    );
  }

  const waiting = drafts.filter((d) => d.status === "draft").length;
  const screenProps = {
    t,
    lang,
    catalog,
    incidents,
    drafts,
    worker,
    refresh,
    reloadCatalog,
    notify,
    go,
    signOut,
  };
  const Current =
    route === "incident"
      ? IncidentDetail
      : (SCREENS.find((s) => s.id === route) || SCREENS[0]).Screen;

  return (
    <div className="app">
      {/* --------------------------------------------------------- header */}
      <header className="header">
        <div className="wrap header-inner">
          <button
            className="logo"
            onClick={() => go("home")}
            aria-label={t("app_name")}
          >
            <LogoMark />
            <span className="logo-text">
              <span className="logo-name">Stadtwerke Plattling</span>
              {/* <span className="logo-tagline">{t("app_tagline")}</span> */}
            </span>
          </button>

          <div className="header-tools">
            {/* Compact language selector */}
            <div className="lang-selector-compact">
              <select
                className="select-compact"
                value={lang}
                onChange={(event) => setLang(event.target.value)}
                aria-label={t("c_language")}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* System notifications for this device, one tap. */}
            <div className="notification-wrapper">
              <button
                className={pushOn ? "iconbtn on" : "iconbtn"}
                onClick={async () => {
                  if (!pushOn) {
                    await turnOnPush();
                  } else {
                    setShowNotifications(!showNotifications);
                  }
                }}
                title={t(pushOn ? "ps_on" : "ps_enable")}
                aria-label={t(pushOn ? "ps_on" : "ps_enable")}
              >
                {pushOn ? <IconBell size={18} /> : <IconBellOff size={18} />}
              </button>
              {showNotifications && pushOn && (
                <div className="notification-dropdown">
                  <div className="notification-header">{t("ps_recent")}</div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <span className="notification-icon">
                        <IconMegaphone size={16} />
                      </span>
                      <span className="notification-text">
                        {t("ps_no_notifications")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              className="iconbtn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? t("c_light") : t("c_dark")}
              aria-label={theme === "dark" ? t("c_light") : t("c_dark")}
            >
              {theme === "dark" ? (
                <IconSun size={18} />
              ) : (
                <IconMoon size={18} />
              )}
            </button>

            {/* User menu */}
            <div className="user-menu-wrapper">
              <button
                className="iconbtn user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={t("um_menu")}
                aria-label={t("um_menu")}
                aria-expanded={showUserMenu}
              >
                <IconUser size={18} />
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <span className="user-menu-name">
                      {worker?.name || t("um_menu")}
                    </span>
                  </div>
                  <div className="user-menu-items">
                    <button
                      className="user-menu-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        go("profile");
                      }}
                    >
                      <IconUser size={16} />
                      <span>{t("um_profile")}</span>
                    </button>
                    {/* <button
                      className="user-menu-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        // Settings could go here in future
                      }}
                    >
                      <IconSettings size={16} />
                      <span>{t("um_settings")}</span>
                    </button> */}
                    <div className="user-menu-divider" />
                    <button
                      className="user-menu-item user-menu-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                    >
                      <IconLogout size={16} />
                      <span>{t("um_logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------- navigation (desktop) */}
      <nav className="tabs-desktop">
        <div className="wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              aria-current={route === tab.id ? "page" : undefined}
              aria-label={t(tab.labelKey)}
              onClick={() => go(tab.id)}
            >
              <span aria-hidden="true" className="ico">
                {tab.icon}
              </span>
              {t(tab.labelKey)}
              {tab.id === "send" && waiting > 0 && (
                <span className="dot">{waiting}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* -------------------------------------------------------- content */}
      <main className="main">
        <div className="wrap">
          {catalog ? (
            <Current {...screenProps} />
          ) : (
            <p className="loading">{t("c_loading")}</p>
          )}
        </div>
      </main>

      {/* ------------------------------------------- floating help button */}
      {route !== "manual" && (
        <button
          className="fab"
          onClick={() => go("manual")}
          aria-label={t("nav_manual")}
        >
          <span aria-hidden="true">
            <IconHelp size={20} />
          </span>
          <span className="fab-text">{t("nav_manual")}</span>
        </button>
      )}

      {/* -------------------------------------------- navigation (mobile) */}
      <nav className="tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            aria-current={route === tab.id ? "page" : undefined}
            aria-label={t(tab.labelKey)}
            onClick={() => go(tab.id)}
          >
            <span className="ico" aria-hidden="true">
              {tab.icon}
            </span>
            {t(tab.labelKey)}
            {tab.id === "send" && waiting > 0 && (
              <span className="dot">{waiting}</span>
            )}
          </button>
        ))}
      </nav>

      <Footer t={t} go={go} />
      <Toast message={toast} />
    </div>
  );
}
