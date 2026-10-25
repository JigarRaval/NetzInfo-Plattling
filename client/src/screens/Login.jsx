/**
 * Login.jsx - Username/PIN login
 *
 * Features:
 * - Username + PIN authentication
 * - Remember me functionality
 * - Keyboard support (Enter to submit, Tab navigation)
 * - PIN show/hide toggle
 * - Better error messages
 * - Focus management
 */

import React, { useState, useEffect, useRef } from "react";
import { api, setToken } from "../lib/api.js";
import { Button } from "../ui/kit.jsx";
import { LogoMark } from "../ui/Logo.jsx";
import { IconUnlock, IconUser, IconEye, IconEyeOff } from "../ui/Icons.jsx";

export default function Login({ t, workers = [], onDone }) {
  const [username, setUsername] = useState(() => localStorage.getItem("Stadtwerke-username") || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(0); // seconds left after a lockout
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("Stadtwerke-remember") === "true");
  const [showPin, setShowPin] = useState(false);
  const usernameInputRef = useRef(null);
  const pinInputRef = useRef(null);

  // Focus PIN input on mount if username is remembered, otherwise focus username
  useEffect(() => {
    if (username) {
      pinInputRef.current?.focus();
    } else {
      usernameInputRef.current?.focus();
    }
  }, []);

  // Handle PIN change (only numbers)
  function handlePinChange(value) {
    const numeric = value.replace(/[^0-9]/g, "");
    setPin(numeric);
  }

  // Countdown lockout timer
  useEffect(() => {
    if (locked > 0) {
      const timer = setTimeout(() => setLocked(locked - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [locked]);

  // Handle Enter key for form submission
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePinLogin();
    }
  }

  async function handlePinLogin() {
    if (!username || !pin) {
      setError(t("lg_error_required"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await api.login(pin, username);
      setToken(result.token);

      if (rememberMe) {
        localStorage.setItem("Stadtwerke-username", username);
        localStorage.setItem("Stadtwerke-remember", "true");
      } else {
        localStorage.removeItem("Stadtwerke-username");
        localStorage.removeItem("Stadtwerke-remember");
      }

      onDone(result.worker);
    } catch (problem) {
      if (problem.status === 429) {
        const retryAfter = problem.data?.retryAfter || 0;
        setLocked(retryAfter);
        setError(t("lg_error_locked", { n: retryAfter }));
      } else {
        setError(t("lg_error_invalid"));
      }
      setPin("");
      pinInputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  function togglePinVisibility() {
    setShowPin(!showPin);
    // Refocus PIN input after toggle
    setTimeout(() => pinInputRef.current?.focus(), 0);
  }

  return (
    <div className="login login--enhanced">
      <div className="login-box">
        <LogoMark size={54} />
        <h1 className="login-title">Stadtwerke Plattling</h1>
        <p className="login-sub">Secure Access Portal</p>

        <div className="login-method">
          <div className="form-group">
            <label htmlFor="username">{t("lg_username")}</label>
            <input
              ref={usernameInputRef}
              id="username"
              type="text"
              className="control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("lg_username")}
              autoComplete="username"
              disabled={busy}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin">{t("lg_pin")}</label>
            <div className="input-with-toggle">
              <input
                ref={pinInputRef}
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                className="control"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder={t("lg_pin")}
                maxLength={8}
                autoComplete="current-password"
                disabled={busy}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="pin-toggle"
                onClick={togglePinVisibility}
                disabled={busy}
                aria-label={showPin ? t("lg_hide_pin") : t("lg_show_pin")}
                title={showPin ? t("lg_hide_pin") : t("lg_show_pin")}
              >
                {showPin ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={busy}
            />
            <span>{t("lg_remember")}</span>
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <Button
            block
            icon={<IconUnlock size={20} />}
            onClick={handlePinLogin}
            disabled={busy || !username || !pin}
          >
            {busy ? t("lg_verifying") : t("lg_button")}
          </Button>

          <div className="login-footer">
            <button
              type="button"
              className="link-button"
              onClick={() => alert(t("lg_contact_admin"))}
              disabled={busy}
            >
              {t("lg_forgot_pin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
