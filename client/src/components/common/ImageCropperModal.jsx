import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiRotateCw, FiRotateCcw, FiZoomIn, FiZoomOut,
  FiMaximize2, FiCheck, FiRefreshCw, FiCrop
} from 'react-icons/fi';

/**
 * Enterprise Image Cropper Modal
 * Supports: Zoom, Rotate (Left/Right), Flip (H/V), Ratios (1:1, 4:3, 3:4, 16:9, Free), Reset, Live Preview & Compression
 */
const ImageCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1', '4:3', '3:4', '16:9', 'FREE'
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const ratios = [
    { label: '1:1 (Square)', value: '1:1', width: 1, height: 1 },
    { label: '3:4 (Portrait)', value: '3:4', width: 3, height: 4 },
    { label: '4:3 (Landscape)', value: '4:3', width: 4, height: 3 },
    { label: '16:9 (Banner)', value: '16:9', width: 16, height: 9 },
    { label: 'Free Ratio', value: 'FREE', width: 0, height: 0 },
  ];

  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('1:1');
  };

  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Target aspect ratio math
      let targetW = img.naturalWidth;
      let targetH = img.naturalHeight;

      if (aspectRatio === '1:1') {
        const side = Math.min(targetW, targetH);
        targetW = side;
        targetH = side;
      } else if (aspectRatio === '3:4') {
        targetH = Math.min(targetH, Math.floor(targetW * (4 / 3)));
        targetW = Math.floor(targetH * (3 / 4));
      } else if (aspectRatio === '4:3') {
        targetW = Math.min(targetW, Math.floor(targetH * (4 / 3)));
        targetH = Math.floor(targetW * (3 / 4));
      } else if (aspectRatio === '16:9') {
        targetW = Math.min(targetW, Math.floor(targetH * (16 / 9)));
        targetH = Math.floor(targetW * (9 / 16));
      }

      canvas.width = targetW;
      canvas.height = targetH;

      ctx.save();

      // Center transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

      // Draw centered image
      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      );

      ctx.restore();

      // Convert to compressed WebP data URL
      const croppedDataUrl = canvas.toDataURL('image/webp', 0.92);
      onCropComplete(croppedDataUrl);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error('Crop failed:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-charcoal-900 border border-gold-500/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-charcoal-950">
            <div className="flex items-center gap-2 text-gold-400 font-bold">
              <FiCrop className="w-5 h-5" />
              <span>Advanced Image Editor & Cropper</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Editor Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Image Preview Canvas Area */}
            <div className="relative w-full h-64 sm:h-80 bg-black/60 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={imageSrc}
                  alt="Crop Target"
                  className="max-h-64 sm:max-h-72 object-contain select-none shadow-lg"
                />
              </div>

              {/* Aspect Ratio Guideline Overlay */}
              <div className="absolute inset-0 border-2 border-gold-500/40 pointer-events-none rounded-xl" />
            </div>

            {/* Controls Toolbar */}
            <div className="space-y-4">
              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                        aspectRatio === r.value
                          ? 'bg-gold-500 text-black shadow-md'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {r.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <FiZoomOut /> Zoom
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  aria-label="Zoom slider"
                  className="flex-1 accent-gold-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gold-400 flex items-center gap-1">
                  {Math.round(zoom * 100)}% <FiZoomIn />
                </span>
              </div>

              {/* Action Buttons: Rotation, Flip, Reset */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotateLeft}
                    className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition flex items-center gap-1 text-xs font-semibold"
                    title="Rotate Left 90°"
                  >
                    <FiRotateCcw className="w-4 h-4 text-gold-400" /> -90°
                  </button>
                  <button
                    onClick={handleRotateRight}
                    className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition flex items-center gap-1 text-xs font-semibold"
                    title="Rotate Right 90°"
                  >
                    <FiRotateCw className="w-4 h-4 text-gold-400" /> +90°
                  </button>
                  <button
                    onClick={() => setFlipH(!flipH)}
                    className={`p-2 rounded-lg transition text-xs font-semibold ${
                      flipH ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    ↔ Flip H
                  </button>
                  <button
                    onClick={() => setFlipV(!flipV)}
                    className={`p-2 rounded-lg transition text-xs font-semibold ${
                      flipV ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    ↕ Flip V
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center gap-1 text-xs font-semibold"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-charcoal-950">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-sm hover:from-gold-400 shadow-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              Apply Crop & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageCropperModal;
