/**
 * Login.jsx - the PIN screen for the field device.
 *
 * Deliberately a number pad and nothing else: it has to work with wet hands,
 * gloves and one thumb. The session then lasts twelve hours, so nobody has
 * to log in again in the middle of a shift.
 */

import React, { useState } from "react";
import { api, setToken } from "../lib/api.js";
import { Button } from "../ui/kit.jsx";
import { LogoMark } from "../ui/Logo.jsx";

export default function Login({ t, workers = [], onDone }) {
  const [workerId, setWorkerId] = useState(
    () => localStorage.getItem("stadtwerke-worker") || ""
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [locked, setLocked] = useState(0); // seconds left after a lockout
  const [busy, setBusy] = useState(false);

  function type(digit) {
    setError(false);
    setLocked(0);
    setPin((current) => (current + digit).slice(0, 8));
  }

  async function submit(value = pin) {
    if (!value) return;
    setBusy(true);
    try {
      const result = await api.login(value, workerId);
      setToken(result.token);
      // Remember the person on this device, so the next shift start is faster.
      if (workerId) localStorage.setItem("stadtwerke-worker", workerId);
      onDone(result.worker);
    } catch (problem) {
      // 429 means this person is locked out after too many wrong attempts.
      setLocked(problem.status === 429 ? problem.data?.retryAfter || 0 : 0);
      setError(problem.status !== 429);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-box">
        <LogoMark size={54} />
        <h1 className="login-title">
          Netz<em>Info</em>
        </h1>
        <p className="login-sub">{t("lg_sub")}</p>

        {/* Who is holding the device. The PIN proves the team, the name says
            who reported it - that is what ends up in the record. */}
        {workers.length > 0 && (
          <select
            className="control login-worker"
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            aria-label={t("lg_who")}
          >
            <option value="">{t("lg_who")}</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        )}

        <div className={error ? "pin pin--error" : "pin"} aria-live="polite">
          {pin ? "•".repeat(pin.length) : t("lg_enter")}
        </div>
        {error && <p className="login-error">{t("lg_wrong")}</p>}
        {locked > 0 && (
          <p className="login-error">{t("lg_locked", { s: locked })}</p>
        )}

        <div className="pinpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              className="pinkey"
              onClick={() => type(String(digit))}
            >
              {digit}
            </button>
          ))}
          <button className="pinkey pinkey--soft" onClick={() => setPin("")}>
            ⌫
          </button>
          <button className="pinkey" onClick={() => type("0")}>
            0
          </button>
          <button
            className="pinkey pinkey--go"
            onClick={() => submit()}
            disabled={busy || !pin}
          >
            →
          </button>
        </div>

        <Button
          block
          icon="🔓"
          onClick={() => submit()}
          disabled={busy || !pin || (workers.length > 0 && !workerId)}
        >
          {busy ? t("c_loading") : t("lg_button")}
        </Button>
      </div>
    </div>
  );
}
