/**
 * LocationPicker.jsx - an interactive map of the reported position.
 *
 * The GPS fix is only a starting point. The burst pipe is often thirty
 * metres away, across the street or behind the building, so the person
 * reporting has to be able to correct it: drag the marker, or tap the map.
 *
 * Performance decisions, because this sits inside a form that must stay fast:
 *   - Leaflet and its stylesheet are imported dynamically, so they are only
 *     downloaded once somebody actually captures a position. The main bundle
 *     does not grow for everybody else.
 *   - the map is created once and then only the marker moves
 *   - it is destroyed on unmount, so no tile requests keep running
 */

import React, { useEffect, useRef, useState } from "react";

export function LocationPicker({
  lat,
  lng,
  accuracy,
  onMove,
  hint,
  recenterLabel,
  onRecenter,
  openLabel,
}) {
  const holder = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const moveRef = useRef(onMove);
  const [failed, setFailed] = useState(false);

  // Keep the newest callback without re-creating the map.
  useEffect(() => {
    moveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !holder.current || mapRef.current) return;

        const map = L.map(holder.current).setView([lat, lng], 17);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        // A CSS pin instead of Leaflet's default image: bundlers break the
        // default icon paths, and this has nothing to load at all.
        const icon = L.divIcon({
          className: "mappin",
          html: "<span></span>",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon,
          autoPan: true,
        }).addTo(map);

        const report = (position) => {
          moveRef.current?.(
            Number(position.lat.toFixed(6)),
            Number(position.lng.toFixed(6))
          );
        };
        marker.on("dragend", () => report(marker.getLatLng()));
        map.on("click", (event) => {
          marker.setLatLng(event.latlng);
          report(event.latlng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        // The container is measured after it becomes visible.
        setTimeout(() => map.invalidateSize(), 60);
      } catch {
        setFailed(true); // offline: the coordinates below still work
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // created once on purpose - later positions only move the marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A better GPS fix arrives: move the marker, but do not yank the view away
  // from wherever the user has just panned to.
  useEffect(() => {
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
  }, [lat, lng]);

  const full = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className="picker">
      <div
        ref={holder}
        className="picker-map"
        role="application"
        aria-label={hint}
      />
      {failed && <p className="small muted">{openLabel}</p>}

      <div className="picker-foot">
        <span className="xs muted">{hint}</span>
        <button type="button" className="linkish xs" onClick={onRecenter}>
          {recenterLabel}
        </button>
      </div>

      <div className="picker-foot">
        <span className="mono xs">
          {lat}, {lng}
          {accuracy ? ` · ±${accuracy} m` : ""}
        </span>
        <a className="xs" href={full} target="_blank" rel="noreferrer">
          {openLabel}
        </a>
      </div>
    </div>
  );
}
