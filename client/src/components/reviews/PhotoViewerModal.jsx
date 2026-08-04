import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';

const PhotoViewerModal = ({ photos, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Reset zoom on photo change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex < photos.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(1, scale - e.deltaY * 0.01), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch to zoom handled in onTouchMove if needed, but wheel usually covers some
      // For pure mobile pinch-zoom, a full gesture library is better, but we provide simple scale here.
    } else if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center overflow-hidden"
        onClick={onClose}
        onWheel={handleWheel}
      >
        {/* Header Controls */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white/70 text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/70 bg-black/30 rounded-lg px-2">
              <button onClick={(e) => { e.stopPropagation(); setScale(Math.max(1, scale - 0.5)); }} className="p-2 hover:text-white transition"><FiZoomOut size={18} /></button>
              <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={(e) => { e.stopPropagation(); setScale(Math.min(4, scale + 0.5)); }} className="p-2 hover:text-white transition"><FiZoomIn size={18} /></button>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm">
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
          >
            <FiChevronLeft size={24} />
          </button>
        )}
        
        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
          >
            <FiChevronRight size={24} />
          </button>
        )}

        {/* Image Container */}
        <div 
          className={`relative w-full h-full flex items-center justify-center ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            ref={imageRef}
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: scale,
              x: position.x,
              y: position.y
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, opacity: { duration: 0.2 } }}
            src={photos[currentIndex]}
            alt="Review upload"
            className="max-w-full max-h-full object-contain select-none"
            draggable="false"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoViewerModal;
