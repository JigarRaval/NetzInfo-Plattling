/**
 * DistrictMap.jsx — schematic map of the affected districts.
 *
 * Deliberately an inline SVG instead of a tile map: it renders instantly,
 * works with no internet at all (important on event Wi-Fi and in a cellar)
 * and raises no privacy or licensing questions for a public authority.
 * Swapping in real map tiles later means replacing only this component.
 */

import React from 'react';

export function DistrictMap({ districts, affected = [], label }) {
  const isHit = (id) => affected.includes(id);

  return (
    <svg className="map" viewBox="0 0 100 75" role="img" aria-label={label}>
      {/* The river gives the schematic an orientation people recognise. */}
      <path className="river" d="M0 62 Q 25 54, 48 60 T 100 52" />
      <text className="label" x="2.5" y="69">Isar</text>

      {districts.map((district) => (
        <g key={district.id}>
          {isHit(district.id) && (
            <circle className="ring" cx={district.x} cy={district.y} r="7">
              <animate attributeName="r" values="5;9.5;5" dur="2.6s" repeatCount="indefinite" />
            </circle>
          )}
          <circle
            className={isHit(district.id) ? 'dot dot--hit' : 'dot'}
            cx={district.x}
            cy={district.y}
            r={isHit(district.id) ? 3.1 : 2}
          />
          <text
            className={isHit(district.id) ? 'label label--hit' : 'label'}
            x={district.x + 4.6}
            y={district.y + 1.3}
          >
            {district.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
