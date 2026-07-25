import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiRotateCw, FiMaximize2 } from 'react-icons/fi';

const ThreeProductViewer = ({ imageUrl, title }) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setRotation(prev => (prev + delta * 0.5) % 360);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative aspect-[3/4] bg-gradient-to-b from-gray-900 via-charcoal-900 to-black rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing border border-gold-500/20 group select-none"
    >
      {/* Dynamic Lighting & Reflections Overlay */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-40" />

      {/* Interactive 3D Product Image with Dynamic Rotation & Perspective */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <motion.img
          src={imageUrl}
          alt={title}
          style={{ transform: `rotateY(${rotation}deg) perspective(1000px) rotateX(5deg)` }}
          className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_30px_rgba(212,175,55,0.25)] transition-transform duration-75"
        />
      </div>

      {/* Control Badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-charcoal-900/80 backdrop-blur-md border border-gold-500/30 text-gold-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow">
          <FiRotateCw className="animate-spin text-gold-400" /> Drag Mouse for 360° Inspection
        </span>
        <span className="p-2 rounded-full bg-charcoal-900/80 backdrop-blur-md text-gold-400 border border-gold-500/30">
          <FiMaximize2 className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default ThreeProductViewer;
