/**
 * LoginEnhanced.jsx - Username/PIN login
 *
 * Features:
 * - Username + PIN authentication
 * - Remember me functionality
 */

import React, { useState, useEffect, useRef } from "react";
import { api, setToken } from "../lib/api.js";
import { Button } from "../ui/kit.jsx";
import { LogoMark } from "../ui/Logo.jsx";
import { IconUnlock, IconUser } from "../ui/Icons.jsx";

export default function LoginEnhanced({ t, workers = [], onDone }) {
  const [username, setUsername] = useState(() => localStorage.getItem("Stadtwerke-username") || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(0); // seconds left after a lockout
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("Stadtwerke-remember") === "true");
  const pinInputRef = useRef(null);

  // Focus PIN input on mount
  useEffect(() => {
    if (pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, []);

  function handlePinChange(value) {
    setError("");
    setLocked(0);
    // Only allow digits, max 8
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setPin(digits);
  }

  // Countdown lockout timer
  useEffect(() => {
    if (locked > 0) {
      const timer = setTimeout(() => setLocked(locked - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [locked]);

  async function handlePinLogin() {
    if (!username || !pin) {
      setError("Please enter username and PIN");
      return;
    }

    setBusy(true);
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
        setLocked(problem.data?.retryAfter || 0);
        setError(`Too many attempts. Try again in ${locked} seconds.`);
      } else {
        setError("Invalid username or PIN");
      }
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login login--enhanced">
      <div className="login-box">
        <LogoMark size={54} />
        <h1 className="login-title">Stadtwerke Plattling</h1>
        <p className="login-sub">Secure Access Portal</p>

        <div className="login-method">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={busy}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin">PIN</label>
            <input
              ref={pinInputRef}
              id="pin"
              type="password"
              inputMode="numeric"
              className="control"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={8}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={busy}
            />
            <span>Remember me</span>
          </label>

          {error && <p className="login-error">{error}</p>}

          <Button
            block
            icon={<IconUnlock size={20} />}
            onClick={handlePinLogin}
            disabled={busy || !username || !pin}
          >
            {busy ? "Verifying..." : "Login"}
          </Button>
        </div>
      </div>
    </div>
  );
}
