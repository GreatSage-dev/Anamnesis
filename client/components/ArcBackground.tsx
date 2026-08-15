import React from 'react';

/**
 * Persistent arc background — the atmospheric glow element.
 * Pure CSS, no canvas needed. Renders at ~30% opacity behind all content.
 */
export default function ArcBackground() {
  return (
    <>
      <div className="arc-background" />
      <div className="arc-particle" />
      <div className="arc-particle" />
      <div className="arc-particle" />
      <div className="arc-particle" />
      <div className="arc-particle" />
      <div className="arc-particle" />
    </>
  );
}
