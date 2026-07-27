import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiX, FiStar, FiMove, FiEdit2 } from 'react-icons/fi';
import ImageCropModal from '../ImageCropModal';

const MAX_IMAGES = 20;
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ImagesStep = ({ images, setImages }) => {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // raw data URL waiting to be cropped
  const [dragIdx, setDragIdx] = useState(null);

  const readFile = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleFiles = async (files) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const valid = Array.from(files).slice(0, remaining).filter(f => ACCEPTED.includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) return;
    // Open cropper for first file; rest queue up
    const dataUrl = await readFile(valid[0]);
    setCropSrc({ dataUrl, remainingFiles: valid.slice(1) });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCropDone = async ({ url, blob }) => {
    const remaining = cropSrc?.remainingFiles || [];
    setImages(prev => [...prev, { id: Date.now() + Math.random(), url, blob, isPrimary: prev.length === 0 }]);
    setCropSrc(null);
    if (remaining.length > 0) {
      const dataUrl = await readFile(remaining[0]);
      setTimeout(() => setCropSrc({ dataUrl, remainingFiles: remaining.slice(1) }), 100);
    }
  };

  const handleRemove = (id) => {
    setImages(prev => {
      const next = prev.filter(img => img.id !== id);
      if (next.length > 0 && !next.some(i => i.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimary = (id) => {
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));
  };

  // Drag reorder
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      setDragIdx(idx);
      return next;
    });
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Product Images</h2>
        <p className="text-sm text-gray-500 mt-0.5">Upload up to {MAX_IMAGES} images. First image becomes the primary. Drag to reorder.</p>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${dragOver ? 'border-yellow-400 bg-yellow-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50/50'}
          ${images.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <FiUpload size={24} className="text-yellow-600" />
        </div>
        <p className="font-bold text-gray-700 text-base">Drop images here or click to browse</p>
        <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB each · Max {MAX_IMAGES} images</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, idx) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-2xl overflow-hidden bg-gray-100 aspect-square border-2 transition cursor-grab active:cursor-grabbing
                ${img.isPrimary ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-transparent hover:border-gray-300'}
                ${dragIdx === idx ? 'opacity-50 scale-95' : ''}
              `}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setPrimary(img.id); }}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition
                    ${img.isPrimary ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white hover:bg-yellow-400 hover:text-black'}`}
                >
                  <FiStar size={11} /> {img.isPrimary ? 'Primary' : 'Set Primary'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(img.id); }}
                  className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition"
                >
                  <FiX size={12} />
                </button>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  PRIMARY
                </div>
              )}

              {/* Index */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {idx + 1}
              </div>

              {/* Drag handle */}
              <div className="absolute top-1.5 right-1.5 text-white/70 opacity-0 group-hover:opacity-100 transition">
                <FiMove size={12} />
              </div>
            </motion.div>
          ))}

          {/* Add More Slot */}
          {images.length < MAX_IMAGES && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-yellow-300 hover:text-yellow-500 hover:bg-yellow-50 transition"
            >
              <FiUpload size={20} className="mb-1" />
              <span className="text-xs font-medium">Add More</span>
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">{images.length} / {MAX_IMAGES} images added</p>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc.dataUrl}
            onDone={handleCropDone}
            onCancel={() => setCropSrc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImagesStep;
