import React from 'react';

/**
 * Anamnesis Logo — "Layered Memory"
 * 
 * Three concentric broken rings with staggered gaps,
 * floating inside a liquid glass orb.
 * 
 * Each ring represents a temporal layer of decision memory:
 * - Outer ring:  oldest precedents (farthest recall)
 * - Middle ring: recent context
 * - Inner ring:  current evaluation
 * 
 * The gaps are staggered at different rotation angles,
 * suggesting fragments assembling into coherence.
 */

interface AnamnesisLogoProps {
  size?: number;
  showOrb?: boolean;
  className?: string;
}

export default function AnamnesisLogo({ size = 40, showOrb = true, className = '' }: AnamnesisLogoProps) {
  const markSize = showOrb ? size * 0.52 : size;

  const mark = (
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="anamnesis-logo-mark"
    >
      {/* Outer ring — 270° arc, gap at top-right */}
      <path
        d="M 79.4 29.3 A 38 38 0 1 1 70.7 20.6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle ring — 240° arc, gap at bottom-left */}
      <path
        d="M 28.5 62.0 A 26 26 0 1 1 36.0 72.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner ring — 200° arc, gap at right */}
      <path
        d="M 62.0 56.8 A 14 14 0 1 1 62.0 43.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center dot — the current moment */}
      <circle cx="50" cy="50" r="2.2" fill="currentColor" />
    </svg>
  );

  if (!showOrb) {
    return (
      <span className={`anamnesis-logo-inline ${className}`}>
        {mark}
      </span>
    );
  }

  return (
    <span className={`anamnesis-logo-orb ${className}`} style={{ width: size, height: size }}>
      {/* Glass layers */}
      <span className="orb-glass" />
      <span className="orb-reflection" />
      <span className="orb-inner-glow" />
      {/* The mark */}
      {mark}
    </span>
  );
}
