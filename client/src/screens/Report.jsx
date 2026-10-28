/**
 * Report.jsx - create an outage notice in seconds.
 */

import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { Badge, Button, Card, Field, renderIcon } from "../ui/kit.jsx";
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
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(500);

  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState(null);

  // Small inline forms for extending the master data while reporting.
  const [newProblem, setNewProblem] = useState(null);
  const [newPlace, setNewPlace] = useState(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recognitionRef = useRef(null);
  const watchRef = useRef(null);

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

  async function saveProblem() {
    if (!newProblem.name.trim()) {
      notify(`${t("cat_need_name")}`);
      return;
    }

    const needsCategory = newProblem.service === "__new";
    if (needsCategory && !newProblem.serviceName?.trim()) {
      notify(`${t("cat_need_name")}`);
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

      // Ensure the new problem has a valid ETA (default 120 if not set)
      const problemData = {
        ...newProblem,
        service,
        etaMinutes: newProblem.etaMinutes || 120,
      };

      const preset = await api.addPreset(problemData);
      await reloadCatalog();

      // Auto-select the new problem and its ETA
      setPresetId(preset.id);
      setEtaMinutes(preset.etaMinutes || 120);
      setNewProblem(null);
      notify(`${t("cat_added")}`);
    } catch (error) {
      console.error("Failed to add problem:", error);
      if (error.status === 409 || error.message === "already_exists") {
        notify("This problem type already exists.");
      } else if (error.status === 401) {
        notify("Session expired. Please log in again.");
      } else {
        notify(`${t("c_error")}: ${error.message || "Unknown"}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePlace() {
    if (!newPlace.name.trim()) {
      notify(`${t("cat_need_name")}`);
      return;
    }
    setBusy(true);
    try {
      const district = await api.addDistrict(newPlace);
      await reloadCatalog();

      // Auto-select the new place
      setDistricts((current) => [...current, district.id]);
      setNewPlace(null);
      notify(`${t("cat_added")}`);
    } catch (error) {
      console.error("Failed to add place:", error);
      if (error.status === 409 || error.message === "already_exists") {
        notify("This location already exists.");
      } else if (error.status === 401) {
        notify("Session expired. Please log in again.");
      } else {
        notify(`${t("c_error")}: ${error.message || "Unknown"}`);
      }
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
      notify(`${t("cat_removed")}`);
    } catch {
      notify(`${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  function choosePreset(preset) {
    setPresetId(preset.id);
    if (preset.etaMinutes) {
      setEtaMinutes(preset.etaMinutes);
    } else {
      setEtaMinutes(120); // Default fallback
    }
    setShowDetails(true);
  }

  function toggleDictation() {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!window.isSecureContext) {
      notify(`${t("rp_insecure")}`);
      return;
    }
    if (!Recognition) {
      notify(`${t("rp_dictate_no")}`);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

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
        notify(`${t(reasons[event.error] || "rp_dictate_err")}`);
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
      notify(`${t("rp_dictate_err")}`);
    }
  }

  function useLocation() {
    if (!window.isSecureContext) {
      notify(`${t("rp_insecure")}`);
      return;
    }
    if (!navigator.geolocation) {
      notify(`${t("rp_location_no")}`);
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
      if (ok && best) notify(`${t("rp_location_ok")}`);
    };

    timer = setTimeout(() => finish(true), 12000);

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
        if (fix.accuracy <= 20) finish(true);
      },
      (error) => {
        finish(false);
        const reasons = {
          1: "rp_loc_denied",
          2: "rp_loc_unavailable",
          3: "rp_loc_timeout",
        };
        notify(`${t(reasons[error.code] || "rp_location_no")}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function moveMarker(lat, lng) {
    const fix = { lat, lng, accuracy: null, manual: true };
    setCoords(fix);
    describe(fix, true);
  }

  async function describe(fix, force = false) {
    try {
      const { place } = await api.reverseGeocode(fix.lat, fix.lng);
      if (place?.label) {
        setAddress(place.label);
        setStreet((current) =>
          force || !current.trim() ? place.label : current
        );
      }
    } catch {
      /* a missing street name is not an error */
    }
  }

  async function submit() {
    if (!presetId) {
      notify(`${t("rp_need_preset")}`);
      return;
    }
    if (districts.length === 0) {
      notify(`${t("rp_need_district")}`);
      return;
    }
    if (!etaMinutes) {
      notify(`${t("rp_need_duration")}`);
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
      await api.createDraft(incident.id, "first");
      await refresh();
      go("send");
    } catch (error) {
      if (error.status === 409 && error.data?.incident)
        setDuplicate(error.data.incident);
      else notify(`${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  async function updateInstead() {
    setBusy(true);
    try {
      await api.createDraft(duplicate.id, "update");
      await refresh();
      setDuplicate(null);
      go("send");
    } catch {
      notify(`${t("c_error")}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>{t("rp_title")}</h1>
        <p className="muted small">{t("rp_sub")}</p>
      </div>

      {duplicate && (
        <Card title={t("rp_dup_title")}>
          <p className="small">{t("rp_dup_text")}</p>
          <div className="row">
            <Button icon="edit" onClick={updateInstead} disabled={busy}>
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

      <Card title={t("rp_s1_title")} subtitle={t("rp_s1_hint")}>
        <div className="choices">
          {catalog.presets.map((preset) => (
            <button
              key={preset.id}
              className="choice"
              aria-pressed={presetId === preset.id}
              onClick={() => choosePreset(preset)}
            >
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
              +
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
              label={`${t("cat_duration")}: ${
                newProblem.etaMinutes
                  ? `${newProblem.etaMinutes} ${t("c_minutes")}`
                  : "120 " + t("c_minutes")
              }`}
              htmlFor="np-eta"
            >
              <input
                id="np-eta"
                type="range"
                min="30"
                max="720"
                step="30"
                value={newProblem.etaMinutes || 120}
                onChange={(e) =>
                  setNewProblem({
                    ...newProblem,
                    etaMinutes: Number(e.target.value),
                  })
                }
              />
            </Field>
            <div className="row">
              <Button
                size="sm"
                icon="plus"
                onClick={saveProblem}
                disabled={busy}
              >
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

      <Card title={t("rp_s2_title")} subtitle={t("rp_s2_hint")}>
        <div className="chips">
          {catalog.districts.map((district) => (
            <button
              key={district.id}
              className="chip"
              aria-pressed={districts.includes(district.id)}
              onClick={() => toggleDistrict(district.id)}
            >
              {districts.includes(district.id) ? "✓ " : ""}
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
                  ×
                </span>
              )}
            </button>
          ))}
          <button
            className="chip chip--add"
            onClick={() => setNewPlace({ name: "", households: 100 })}
          >
            + {t("cat_add_district")}
          </button>
        </div>

        <Field
          label={`⏳ ${t("rp_duration")}: ${
            etaMinutes ? `${etaMinutes} ${t("c_minutes")}` : t("rp_need_preset")
          }`}
          htmlFor="eta"
          style={{ marginTop: 14 }}
        >
          <input
            id="eta"
            type="range"
            min="30"
            max="720"
            step="30"
            value={etaMinutes || 120}
            onChange={(event) => setEtaMinutes(Number(event.target.value))}
          />
        </Field>

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
              <Button size="sm" icon="plus" onClick={savePlace} disabled={busy}>
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
            icon="mapPin"
            onClick={useLocation}
            disabled={locating}
          >
            {locating ? t("rp_locating") : t("rp_location")}
          </Button>
          {households > 0 && (
            <Badge>
              {households} {t("c_households")}
            </Badge>
          )}
        </div>

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

      <Card
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
            <Field label={`${t("rp_street")}`} htmlFor="street">
              <input
                id="street"
                type="text"
                value={street}
                placeholder={t("rp_street_ph")}
                onChange={(event) => setStreet(event.target.value)}
              />
            </Field>

            <Field
              label={`${t("rp_radius")}: ${(radiusMeters / 1000).toFixed(
                1
              )} km`}
              htmlFor="radius"
            >
              <input
                id="radius"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={radiusMeters}
                onChange={(event) =>
                  setRadiusMeters(Number(event.target.value))
                }
              />
            </Field>

            <Field
              label={`${t("rp_note")}`}
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
                  icon={listening ? "stop" : "mic"}
                  onClick={toggleDictation}
                >
                  {listening ? t("rp_dictate_stop") : t("rp_dictate")}
                </Button>
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
            {etaMinutes
              ? `${etaMinutes} ${t("c_minutes")}`
              : t("rp_need_preset")}{" "}
            · {t("rp_street")} · {t("rp_note")}
          </p>
        )}
      </Card>

      <Button
        block
        icon="arrowRight"
        onClick={() => submit()}
        disabled={busy || !presetId || districts.length === 0 || !etaMinutes}
      >
        {busy ? t("rp_submitting") : t("rp_submit")}
      </Button>
    </div>
  );
}
