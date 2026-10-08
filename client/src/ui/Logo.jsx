/**
 * Logo.jsx — the brand mark.
 *
 * An inline SVG rather than an image file: it inherits colours, stays sharp
 * on every screen and needs no network request, which matters because the
 * app must also work offline.
 */

import React from 'react';

export function LogoMark({ size = 38 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="NetzInfo">
      <defs>
        <linearGradient id="netzinfo-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b74b8" />
          <stop offset="1" stopColor="#0a2e52" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#netzinfo-logo)" />
      {/* a network ring: the four utilities connected by one system */}
      <circle cx="32" cy="32" r="22" fill="none" stroke="#ffffff" strokeOpacity=".3" strokeWidth="2" />
      {/* the bolt: the moment something fails */}
      <path d="M36 12 20 38h11l-3 16 17-28H33z" fill="#ffc63d" />
    </svg>
  );
}
