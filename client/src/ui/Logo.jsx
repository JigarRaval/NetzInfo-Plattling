import React from "react";

export function LogoMark({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Shield base for municipal trust */}
      <path
        d="M50 5 L85 20 V50 C85 75 50 95 50 95 C50 95 15 75 15 50 V20 Z"
        fill="#FFFFFF"
        stroke="#F6AD55"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Inner circle for modern app feel */}
      <circle cx="50" cy="48" r="28" fill="#0F4A73" />

      {/* Dynamic Lightning Bolt (Energy) */}
      <path
        d="M52 20 L35 50 H48 L45 75 L65 45 H52 Z"
        fill="#F6AD55"
        stroke="#F6AD55"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Subtle Water Wave (Water/Environment) */}
      <path
        d="M30 65 Q40 58 50 65 T70 65"
        stroke="#60A5FA"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
