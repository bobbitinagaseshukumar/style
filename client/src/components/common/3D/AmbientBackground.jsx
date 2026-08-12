import React from 'react';

/**
 * Global Subtle 3D Ambient Background
 * Adds soft, slow-moving radial light blobs that create visual depth across all pages.
 */
const AmbientBackground = () => {
  return (
    <div className="ambient-bg-glow" aria-hidden="true">
      <div className="ambient-blob-1" />
      <div className="ambient-blob-2" />
    </div>
  );
};

export default AmbientBackground;
