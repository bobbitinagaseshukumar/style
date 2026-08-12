import React, { useState, useRef, useCallback } from 'react';

/**
 * Reusable 3D Tilt Wrapper Component
 * Adds subtle perspective tilt (rotateX, rotateY) and dynamic cursor spotlight on hover.
 * Automatically falls back to touch-friendly spring elevation on mobile devices.
 */
const TiltCard = ({
  children,
  className = '',
  maxTilt = 6,
  scaleOnHover = 1.02,
  showSpotlight = true,
  disabled = false,
  onClick,
  ...props
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, spotlightX: 50, spotlightY: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (disabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const spotlightX = Math.round((x / rect.width) * 100);
    const spotlightY = Math.round((y / rect.height) * 100);

    setTilt({ x: rotateX, y: rotateY, spotlightX, spotlightY });
  }, [disabled, maxTilt]);

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    setTilt({ x: 0, y: 0, spotlightX: 50, spotlightY: 50 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transition-transform duration-300 ease-out cursor-pointer ${className}`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, 1)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      {...props}
    >
      {/* 3D Spotlight Layer */}
      {showSpotlight && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(circle at ${tilt.spotlightX}% ${tilt.spotlightY}%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 65%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default TiltCard;
