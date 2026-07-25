import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZoomIn, FiZoomOut, FiRotateCw, FiRotateCcw, FiRefreshCw, FiCheck } from 'react-icons/fi';

/* ─── Get Cropped Image from Canvas ─────────────────────────── */
const getCroppedImg = (imageSrc, pixelCrop, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
      canvas.width = safeArea;
      canvas.height = safeArea;
      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);
      ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);
      const data = ctx.getImageData(0, 0, safeArea, safeArea);
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
      );
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas is empty')); return; }
        const url = URL.createObjectURL(blob);
        resolve({ url, blob });
      }, 'image/webp', 0.92);
    });
    image.addEventListener('error', reject);
    image.src = imageSrc;
  });
};

/* ─── Aspect Ratio Presets ───────────────────────────────────── */
const ASPECTS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
];

const ImageCropModal = ({ imageSrc, onDone, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, cap) => setCroppedAreaPixels(cap), []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    try {
      setProcessing(true);
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onDone(result);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-bold text-lg">Crop Image</h3>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition p-2 rounded-lg hover:bg-white/10">
            <FiX size={18} />
          </button>
        </div>

        {/* Cropper Canvas */}
        <div className="relative flex-1 bg-black/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { background: '#111' } }}
          />
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 bg-[#111] border-t border-white/10 px-5 py-4 space-y-4">
          {/* Aspect Ratio */}
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest w-16">Aspect</span>
            <div className="flex gap-2">
              {ASPECTS.map(a => (
                <button
                  key={a.label}
                  onClick={() => setAspect(a.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${aspect === a.value ? 'bg-yellow-400 text-black border-yellow-400' : 'border-white/20 text-white/60 hover:border-white/40'}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest w-16">Zoom</span>
            <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition"><FiZoomOut size={14}/></button>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-yellow-400 h-1.5 rounded-full" />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition"><FiZoomIn size={14}/></button>
            <span className="text-white/40 text-xs w-10 text-right">{zoom.toFixed(1)}x</span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest w-16">Rotate</span>
            <button onClick={() => setRotation(r => r - 90)} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition"><FiRotateCcw size={14}/></button>
            <input type="range" min={-180} max={180} step={1} value={rotation} onChange={e => setRotation(Number(e.target.value))}
              className="flex-1 accent-yellow-400 h-1.5 rounded-full" />
            <button onClick={() => setRotation(r => r + 90)} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition"><FiRotateCw size={14}/></button>
            <span className="text-white/40 text-xs w-10 text-right">{rotation}°</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm hover:bg-white/5 transition"
            >
              <FiRefreshCw size={13} /> Reset
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {processing ? (
                <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>&nbsp;Processing...</>
              ) : (
                <><FiCheck size={15}/> Apply Crop</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageCropModal;
