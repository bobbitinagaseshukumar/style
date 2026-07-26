import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiX, FiRotateCw, FiRotateCcw, FiZoomIn, FiZoomOut,
  FiCheck, FiRefreshCw, FiCrop, FiImage
} from 'react-icons/fi';

const ASPECT_RATIOS = [
  { label: 'Square (1:1)', value: 1 / 1 },
  { label: 'Standard (4:3)', value: 4 / 3 },
  { label: 'Widescreen (16:9)', value: 16 / 9 },
  { label: 'Free Crop', value: null },
];

const SubcategoryCropperModal = ({ imageSrc, onClose, onCropComplete }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1 / 1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderPreview();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (imgRef.current) renderPreview();
  }, [zoom, rotation, pan, aspectRatio]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const width = 400;
    const height = aspectRatio ? width / aspectRatio : (img.height / img.width) * width;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center of canvas
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw centered
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export optimized high-quality JPEG
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-gray-100 flex flex-col space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <FiCrop className="text-amber-500" /> Subcategory Image Studio & Cropper
            </h3>
            <p className="text-xs text-gray-500">Zoom, rotate, drag, and crop subcategory image</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer">
            <FiX size={16} />
          </button>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          {ASPECT_RATIOS.map(ratio => (
            <button
              key={ratio.label}
              onClick={() => setAspectRatio(ratio.value)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                aspectRatio === ratio.value ? 'bg-amber-500 text-black shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Canvas Workspace Area */}
        <div
          className="relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center p-4 min-h-[300px] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="max-w-full max-h-[320px] rounded-xl shadow-xl border border-white/20" />
        </div>

        {/* Controls Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 font-semibold text-gray-700"
          >
            <FiZoomIn size={14} /> Zoom In
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 font-semibold text-gray-700"
          >
            <FiZoomOut size={14} /> Zoom Out
          </button>
          <button
            onClick={() => setRotation(prev => (prev - 90) % 360)}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 font-semibold text-gray-700"
          >
            <FiRotateCcw size={14} /> Rotate Left
          </button>
          <button
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 font-semibold text-gray-700"
          >
            <FiRotateCw size={14} /> Rotate Right
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); }}
            className="py-2.5 px-4 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100 text-xs flex items-center gap-1 cursor-pointer"
          >
            <FiRefreshCw size={14} /> Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100 text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCrop}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FiCheck size={16} /> Crop & Save Subcategory Image
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubcategoryCropperModal;
