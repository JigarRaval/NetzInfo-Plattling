/**
 * Report.jsx - create an outage notice in seconds.
 *
 * The fastest path is two taps: pick what happened, pick where, press the
 * button. Everything else sits in a collapsed third step, because a crew in
 * the field has no time for a form.
 *
 * The microphone and the location are offered but never required: if the
 * browser cannot do it, or permission is refused, the report still works.
 */

import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { Badge, Button, Card, Field } from "../ui/kit.jsx";
import { LocationPicker } from "../ui/LocationPicker.jsx";
import { presetName, serviceName } from "../lib/format.js";

export default function Report({
  t,
  lang,
  catalog,
  reloadCatalog,
  refresh,
  notify,
  go,
}) {
  const [presetId, setPresetId] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [etaMinutes, setEtaMinutes] = useState(120);
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [address, setAddress] = useState(""); // street found for that position
  const [locating, setLocating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(500); // affected area radius in meters

  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState(null);

  // Small inline forms for extending the master data while reporting.
  const [newProblem, setNewProblem] = useState(null); // null = form closed
  const [newPlace, setNewPlace] = useState(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState(""); // live text while speaking
  const recognitionRef = useRef(null);
  const watchRef = useRef(null);

  // Stop the microphone and the GPS watch when the screen is left, otherwise
  // they keep running in the background and drain the battery.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* already stopped */
      }
      if (watchRef.current !== null)
        navigator.geolocation.clearWatch(watchRef.current);
    },
    []
  );

  const households = districts
    .map((id) => catalog.districts.find((d) => d.id === id)?.households || 0)
    .reduce((a, b) => a + b, 0);

  function toggleDistrict(id) {
    setDistricts((current) =>
      current.includes(id) ? current.filter((d) => d !== id) : [...current, id]
    );
  }

  /**
   * Add a problem type that is missing from the list.
   *
   * If the chosen category does not exist yet either - a gas smell, a street
   * light - it is created first, so the whole thing stays one step for the
   * person standing in front of the problem.
   */
  async function saveProblem() {
    if (!newProblem.name.trim()) {
      notify(`⚠️ ${t("cat_need_name")}`);
      return;
    }

    const needsCategory = newProblem.service === "__new";
    if (needsCategory && !newProblem.serviceName?.trim()) {
      notify(`⚠️ ${t("cat_need_name")}`);
      return;
    }

    setBusy(true);
    try {
      let service = newProblem.service;
      if (needsCategory) {
        const created = await api.addService({
          name: newProblem.serviceName.trim(),
        });
        service = created.id;
      }
      const preset = await api.addPreset({ ...newProblem, service });
      await reloadCatalog();
      setNewProblem(null);
      setPresetId(preset.id);
      setEtaMinutes(preset.etaMinutes);
      notify(`✅ ${t("cat_added")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  /** Add a place that is missing from the list. */
  async function savePlace() {
    if (!newPlace.name.trim()) {
      notify(`⚠️ ${t("cat_need_name")}`);
      return;
    }
    setBusy(true);
    try {
      const district = await api.addDistrict(newPlace);
      await reloadCatalog();
      setNewPlace(null);
      setDistricts((current) => [...current, district.id]);
      notify(`✅ ${t("cat_added")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(kind, id) {
    setBusy(true);
    try {
      if (kind === "preset") {
        await api.removePreset(id);
        if (presetId === id) setPresetId(null);
      } else {
        await api.removeDistrict(id);
        setDistricts((c) => c.filter((d) => d !== id));
      }
      await reloadCatalog();
      notify(`🗑️ ${t("cat_removed")}`);
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  function choosePreset(preset) {
    setPresetId(preset.id);
    setEtaMinutes(preset.etaMinutes); // a sensible duration without asking
  }

  /* --- dictation --------------------------------------------------------
   * Three things made this look broken before:
   *   1. On a phone the app is opened over plain http on a local IP address.
   *      Browsers block the microphone outside a secure context, and the old
   *      code failed silently. Now it says so.
   *   2. Errors were swallowed, so a denied permission looked like "nothing
   *      happens". Every error case now has its own message.
   *   3. continuous mode without interim results gives no feedback at all
   *      while speaking. One utterance at a time with live text is far more
   *      reliable on mobile browsers, and the user can see that it works.
   */
  function toggleDictation() {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!window.isSecureContext) {
      notify(`🎤 ${t("rp_insecure")}`);
      return;
    }
    if (!Recognition) {
      notify(`🎤 ${t("rp_dictate_no")}`);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    } // onend tidies up

    const recognition = new Recognition();
    recognition.lang =
      { de: "de-DE", en: "en-GB", fr: "fr-FR", es: "es-ES" }[lang] || "de-DE";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final.trim()) {
        setNote((current) => `${current ? `${current} ` : ""}${final.trim()}`);
        setHeard("");
      } else {
        setHeard(interim);
      }
    };

    recognition.onerror = (event) => {
      const reasons = {
        "not-allowed": "rp_mic_denied",
        "service-not-allowed": "rp_mic_denied",
        "audio-capture": "rp_mic_nomic",
        "no-speech": "rp_mic_nospeech",
        network: "rp_mic_network",
      };
      if (event.error !== "aborted")
        notify(`🎤 ${t(reasons[event.error] || "rp_dictate_err")}`);
    };

    recognition.onend = () => {
      setListening(false);
      setHeard("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      setShowDetails(true);
    } catch {
      notify(`🎤 ${t("rp_dictate_err")}`);
    }
  }

  /* --- exact location ---------------------------------------------------
   * The first GPS reading is almost always poor - several hundred metres,
   * sometimes kilometres. A single getCurrentPosition call therefore either
   * returned a useless position or timed out, which looked like "location
   * does not work".
   *
   * This watches the position for up to twelve seconds, keeps the best fix
   * it has seen, and stops early as soon as it is accurate to 20 metres.
   * Every failure reason is reported separately, because "you denied it",
   * "no signal" and "it took too long" need different reactions.
   */
  function useLocation() {
    if (!window.isSecureContext) {
      notify(`📍 ${t("rp_insecure")}`);
      return;
    }
    if (!navigator.geolocation) {
      notify(`📍 ${t("rp_location_no")}`);
      return;
    }
    if (locating) return;

    setLocating(true);
    let best = null;
    let timer = null;

    const finish = (ok) => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (timer) clearTimeout(timer);
      setLocating(false);
      if (ok && best) notify(`📍 ${t("rp_location_ok")}`);
    };

    timer = setTimeout(() => finish(true), 12000); // keep the best fix so far

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const fix = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        };
        if (!best || fix.accuracy < best.accuracy) {
          best = fix;
          setCoords(fix);
          describe(fix);
        }
        if (fix.accuracy <= 20) finish(true); // good enough, stop the GPS
      },
      (error) => {
        finish(false);
        const reasons = {
          1: "rp_loc_denied",
          2: "rp_loc_unavailable",
          3: "rp_loc_timeout",
        };
        notify(`📍 ${t(reasons[error.code] || "rp_location_no")}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  /**
   * The marker was moved by hand. That position is now the truth: the
   * accuracy of the old GPS reading no longer applies, and the address is
   * looked up again for the new spot.
   */
  function moveMarker(lat, lng) {
    const fix = { lat, lng, accuracy: null, manual: true };
    setCoords(fix);
    describe(fix, true);
  }

  /**
   * Ask the server which street this position belongs to and offer it as the
   * address. It is only a suggestion: the field stays editable, and if the
   * lookup is unavailable nothing happens at all.
   */
  async function describe(fix, force = false) {
    try {
      const { place } = await api.reverseGeocode(fix.lat, fix.lng);
      if (place?.label) {
        setAddress(place.label);
        // Only fill the street field while the user has not typed anything -
        // unless the marker was moved deliberately, which is an instruction.
        setStreet((current) =>
          force || !current.trim() ? place.label : current
        );
      }
    } catch {
      /* a missing street name is not an error */
    }
  }

  /* --- submit ----------------------------------------------------------- */
  async function submit() {
    if (!presetId) {
      notify(`⚠️ ${t("rp_need_preset")}`);
      return;
    }
    if (districts.length === 0) {
      notify(`⚠️ ${t("rp_need_district")}`);
      return;
    }

    setBusy(true);
    try {
      const incident = await api.capture({
        presetId,
        districts,
        etaMinutes,
        street,
        note,
        coords,
        radiusMeters,
        source: note ? "speech" : "preset",
      });
      // The text is written immediately, so the next screen is ready to send.
      await api.createDraft(incident.id, "first");
      await refresh();
      go("send");
    } catch (error) {
      // 409 means this outage is already running - there is no way around it,
      // the only sensible action is an update on the existing incident.
      if (error.status === 409 && error.data?.incident)
        setDuplicate(error.data.incident);
      else notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  /** The user chose to add an update to the existing outage. */
  async function updateInstead() {
    setBusy(true);
    try {
      await api.createDraft(duplicate.id, "update");
      await refresh();
      setDuplicate(null);
      go("send");
    } catch {
      notify(`⚠️ ${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>📝 {t("rp_title")}</h1>
        <p className="muted small">{t("rp_sub")}</p>
      </div>

      {/* --------------------------------------------- already reported -- */}
      {duplicate && (
        <Card icon="♻️" title={t("rp_dup_title")}>
          <p className="small">{t("rp_dup_text")}</p>
          <div className="row">
            <Button icon="✏️" onClick={updateInstead} disabled={busy}>
              {t("rp_dup_update")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDuplicate(null)}
              disabled={busy}
            >
              {t("c_cancel")}
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------- what ------- */}
      <Card icon="1️⃣" title={t("rp_s1_title")} subtitle={t("rp_s1_hint")}>
        <div className="choices">
          {catalog.presets.map((preset) => (
            <button
              key={preset.id}
              className="choice"
              aria-pressed={presetId === preset.id}
              onClick={() => choosePreset(preset)}
            >
              <span className="ico" aria-hidden="true">
                {preset.icon}
              </span>
              <span className="name">
                {presetName(catalog, preset.id, lang)}
              </span>
              <span className="meta">
                {serviceName(catalog, preset.service, lang)}
                {preset.custom && (
                  <>
                    {" · "}
                    <span
                      className="linkish"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry("preset", preset.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          removeEntry("preset", preset.id);
                        }
                      }}
                    >
                      {t("cat_remove")}
                    </span>
                  </>
                )}
              </span>
            </button>
          ))}

          {/* anything missing can be added right here, without leaving the form */}
          <button
            className="choice choice--add"
            onClick={() =>
              setNewProblem({
                name: "",
                service: "strom",
                tone: "steady",
                etaMinutes: 120,
              })
            }
          >
            <span className="ico" aria-hidden="true">
              ➕
            </span>
            <span className="name">{t("cat_add_problem")}</span>
          </button>
        </div>

        {newProblem && (
          <div className="addform">
            <Field label={t("cat_name")} htmlFor="np-name">
              <input
                id="np-name"
                type="text"
                value={newProblem.name}
                placeholder={t("cat_name_problem")}
                onChange={(e) =>
                  setNewProblem({ ...newProblem, name: e.target.value })
                }
              />
            </Field>
            <Field label={t("cat_service")} htmlFor="np-service">
              <select
                id="np-service"
                className="control"
                value={newProblem.service}
                onChange={(e) =>
                  setNewProblem({ ...newProblem, service: e.target.value })
                }
              >
                {Object.keys(catalog.services).map((id) => (
                  <option key={id} value={id}>
                    {serviceName(catalog, id, lang)}
                  </option>
                ))}
                {/* the problem does not have to belong to one of the four utilities */}
                <option value="__new">{t("cat_add_service")}</option>
              </select>
            </Field>

            {newProblem.service === "__new" && (
              <Field
                label={t("cat_service_name")}
                hint={t("cat_service_hint")}
                htmlFor="np-cat"
              >
                <input
                  id="np-cat"
                  type="text"
                  value={newProblem.serviceName || ""}
                  placeholder={t("cat_service_ph")}
                  onChange={(e) =>
                    setNewProblem({
                      ...newProblem,
                      serviceName: e.target.value,
                    })
                  }
                />
              </Field>
            )}
            <Field label={t("cat_tone")} htmlFor="np-tone">
              <select
                id="np-tone"
                className="control"
                value={newProblem.tone}
                onChange={(e) =>
                  setNewProblem({ ...newProblem, tone: e.target.value })
                }
              >
                <option value="steady">{t("tone_steady")}</option>
                <option value="reassuring">{t("tone_reassuring")}</option>
                <option value="careful">{t("tone_careful")}</option>
                <option value="light">{t("tone_light")}</option>
              </select>
            </Field>
            <Field
              label={`${t("cat_duration")}: ${newProblem.etaMinutes}`}
              htmlFor="np-eta"
            >
              <input
                id="np-eta"
                type="range"
                min="30"
                max="720"
                step="30"
                value={newProblem.etaMinutes}
                onChange={(e) =>
                  setNewProblem({
                    ...newProblem,
                    etaMinutes: Number(e.target.value),
                  })
                }
              />
            </Field>
            <div className="row">
              <Button size="sm" icon="➕" onClick={saveProblem} disabled={busy}>
                {t("cat_save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNewProblem(null)}
              >
                {t("c_cancel")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- where ------ */}
      <Card icon="2️⃣" title={t("rp_s2_title")} subtitle={t("rp_s2_hint")}>
        <div className="chips">
          {catalog.districts.map((district) => (
            <button
              key={district.id}
              className="chip"
              aria-pressed={districts.includes(district.id)}
              onClick={() => toggleDistrict(district.id)}
            >
              {districts.includes(district.id) ? "✅ " : ""}
              {district.name}
              {district.custom && (
                <span
                  className="linkish"
                  role="button"
                  tabIndex={0}
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry("district", district.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      removeEntry("district", district.id);
                    }
                  }}
                >
                  ✕
                </span>
              )}
            </button>
          ))}
          <button
            className="chip chip--add"
            onClick={() => setNewPlace({ name: "", households: 100 })}
          >
            ➕ {t("cat_add_district")}
          </button>
        </div>

        {newPlace && (
          <div className="addform">
            <Field label={t("cat_name")} htmlFor="nd-name">
              <input
                id="nd-name"
                type="text"
                value={newPlace.name}
                placeholder={t("cat_name_place")}
                onChange={(e) =>
                  setNewPlace({ ...newPlace, name: e.target.value })
                }
              />
            </Field>
            <Field label={t("cat_households")} htmlFor="nd-hh">
              <input
                id="nd-hh"
                type="number"
                min="0"
                value={newPlace.households}
                onChange={(e) =>
                  setNewPlace({
                    ...newPlace,
                    households: Number(e.target.value),
                  })
                }
              />
            </Field>
            <div className="row">
              <Button size="sm" icon="➕" onClick={savePlace} disabled={busy}>
                {t("cat_save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNewPlace(null)}
              >
                {t("c_cancel")}
              </Button>
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 14 }}>
          <Button
            size="sm"
            variant="ghost"
            icon="📍"
            onClick={useLocation}
            disabled={locating}
          >
            {locating ? t("rp_locating") : t("rp_location")}
          </Button>
          {households > 0 && (
            <Badge>
              👪 {households} {t("c_households")}
            </Badge>
          )}
        </div>

        {/* The captured position: the address we found, a small map, and how
            precise the reading currently is. */}
        {coords && (
          <div className="locbox">
            <div className="between">
              <strong>{address || t("rp_loc_looking")}</strong>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCoords(null);
                  setAddress("");
                }}
              >
                {t("rp_location_clear")}
              </Button>
            </div>

            {/* The GPS fix is a starting point: the marker can be dragged
                or the map tapped, and the address follows the marker. */}
            <LocationPicker
              lat={coords.lat}
              lng={coords.lng}
              accuracy={coords.accuracy}
              hint={t("rp_map_hint")}
              recenterLabel={t("rp_map_recenter")}
              openLabel={t("rp_map_open")}
              onRecenter={useLocation}
              onMove={moveMarker}
            />

            <span className="field-hint">
              {coords.manual
                ? t("rp_loc_manual")
                : t("rp_location_acc", { m: coords.accuracy })}
              {locating ? ` · ${t("rp_loc_improving")}` : ""}
            </span>
          </div>
        )}
      </Card>

      {/* --------------------------------------------------- details ----- */}
      <Card
        icon="3️⃣"
        title={t("rp_s3_title")}
        subtitle={t("rp_s3_hint")}
        tail={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "▲" : "▼"}
          </Button>
        }
      >
        {showDetails ? (
          <>
            <Field
              label={`⏳ ${t("rp_duration")}: ${etaMinutes} ${t("c_minutes")}`}
              htmlFor="eta"
            >
              <input
                id="eta"
                type="range"
                min="30"
                max="720"
                step="30"
                value={etaMinutes}
                onChange={(event) => setEtaMinutes(Number(event.target.value))}
              />
            </Field>

            <Field label={`🏠 ${t("rp_street")}`} htmlFor="street">
              <input
                id="street"
                type="text"
                value={street}
                placeholder={t("rp_street_ph")}
                onChange={(event) => setStreet(event.target.value)}
              />
            </Field>

            <Field
              label={`� ${t("rp_radius")}: ${(radiusMeters / 1000).toFixed(1)} km`}
              htmlFor="radius"
            >
              <input
                id="radius"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={radiusMeters}
                onChange={(event) => setRadiusMeters(Number(event.target.value))}
              />
            </Field>

            <Field
              label={`�📝 ${t("rp_note")}`}
              hint={t("rp_dictate_hint")}
              htmlFor="note"
            >
              <textarea
                id="note"
                value={note}
                placeholder={t("rp_note_ph")}
                style={{ minHeight: 100 }}
                onChange={(event) => setNote(event.target.value)}
              />
              <div className="row" style={{ marginTop: 8 }}>
                <Button
                  size="sm"
                  variant={listening ? "recording" : "ghost"}
                  icon={listening ? "⏹️" : "🎤"}
                  onClick={toggleDictation}
                >
                  {listening ? t("rp_dictate_stop") : t("rp_dictate")}
                </Button>
                {/* live feedback, so the user can see that it is working */}
                {listening && (
                  <span className="small muted">
                    {heard || t("rp_listening")}
                  </span>
                )}
              </div>
            </Field>
          </>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            ⏳ {etaMinutes} {t("c_minutes")} · 🏠 {t("rp_street")} · 🎤{" "}
            {t("rp_note")}
          </p>
        )}
      </Card>

      <Button
        block
        icon="➡️"
        onClick={() => submit()}
        disabled={busy || !presetId || districts.length === 0}
      >
        {busy ? t("rp_submitting") : t("rp_submit")}
      </Button>
    </div>
  );
}
