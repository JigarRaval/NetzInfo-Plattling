/**
 * MiniMap.jsx - a small map of the captured position.
 *
 * Deliberately an OpenStreetMap embed in an iframe instead of a map library:
 *   - no dependency, no tile layer to manage, nothing to keep in sync
 *   - it loads one page and then does nothing, so the report form stays fast
 *   - it only exists once a position has been captured, and it is lazy, so a
 *     user who never presses "use my location" pays nothing for it
 *
 * If the device is offline the frame simply stays empty; the coordinates and
 * the link below it still tell the crew where to drive.
 */

import React from "react";

export function MiniMap({ lat, lng, title, openLabel }) {
  // A box of roughly 300 m around the position.
  const d = 0.0018;
  const bbox = [lng - d, lat - d * 0.6, lng + d, lat + d * 0.6].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const full = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <figure className="minimap">
      <iframe
        className="minimap-frame"
        src={src}
        title={title}
        loading="lazy"
      />
      <figcaption className="minimap-foot">
        <span className="mono xs">
          {lat}, {lng}
        </span>
        <a className="xs" href={full} target="_blank" rel="noreferrer">
          {openLabel}
        </a>
      </figcaption>
    </figure>
  );
}
