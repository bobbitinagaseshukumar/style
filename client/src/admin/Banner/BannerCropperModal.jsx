import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiRotateCw, FiRotateCcw, FiZoomIn, FiCheck, FiRefreshCw,
  FiCrop, FiSliders, FiSun, FiEye, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

/* ── Canvas Helper with Image Rotation, Flip, Brightness, Contrast, Saturation ── */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRotatedBBox(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  filters = { brightness: 100, contrast: 100, saturation: 100 }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBBox(image.width, image.height, rotation);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Apply CSS filters on context
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Reset filter for putting back image data
  ctx.filter = 'none';
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/webp', 0.92);
  });
}

const ASPECT_RATIOS = [
  { label: 'Free Crop', val: undefined },
  { label: 'Banner 21:9', val: 21 / 9 },
  { label: 'Widescreen 16:9', val: 16 / 9 },
  { label: 'Standard 4:3', val: 4 / 3 },
  { label: 'Square 1:1', val: 1 },
  { label: 'Portrait 3:4', val: 3 / 4 },
  { label: 'Vertical 9:16', val: 9 / 16 },
];

const BannerCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(21 / 9); // Default to banner 21:9
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const onCropCompleteCallback = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(21 / 9);
    setFlip({ horizontal: false, vertical: false });
    setFilters({ brightness: 100, contrast: 100, saturation: 100 });
    setShowPreview(false);
  };

  const handleGeneratePreview = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip, filters);
      if (blob) {
        setPreviewUrl(URL.createObjectURL(blob));
        setShowPreview(true);
      }
    } catch {
      toast.error('Failed to generate preview');
    }
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setSaving(true);
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip, filters);
      if (!blob) { toast.error('Crop failed'); return; }

      const formData = new FormData();
      formData.append('image', blob, `banner-crop-${Date.now()}.webp`);

      let finalUrl = '';
      try {
        const { data } = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalUrl = data?.data?.url || data?.url || '';
      } catch {
        finalUrl = URL.createObjectURL(blob);
      }

      onCropComplete(finalUrl || URL.createObjectURL(blob), blob);
      toast.success('Image cropped & optimized successfully!');
      onClose();
    } catch {
      toast.error('Error saving cropped image');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <FiCrop size={16} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Shopify-Style Image Cropper & Studio</h3>
                <p className="text-[11px] text-gray-500">Crop, adjust aspect ratio, rotate, flip & fine-tune filters</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 transition"><FiX size={18} /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {showPreview && previewUrl ? (
              /* Preview Mode */
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Real-Time Cropped Preview</span>
                  <button onClick={() => setShowPreview(false)} className="text-xs font-semibold text-amber-600 hover:underline">
                    Back to Cropper
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden bg-slate-950 p-2 shadow-inner">
                  <img src={previewUrl} alt="Cropped Preview" className="w-full max-h-[400px] object-contain mx-auto rounded-xl" />
                </div>
              </div>
            ) : (
              /* Cropper Canvas */
              <div className="space-y-4">
                <div
                  className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 shadow-inner"
                  style={{
                    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`,
                  }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                  />
                </div>

                {/* Aspect Ratios */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Aspect Ratio Presets</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ASPECT_RATIOS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => setAspect(a.val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          aspect === a.val ? 'bg-amber-400 text-black shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls & Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {/* Zoom */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span><FiZoomIn className="inline mr-1" /> Zoom</span>
                      <span>{zoom.toFixed(1)}x</span>
                    </div>
                    <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                  </div>

                  {/* Rotate */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span><FiRotateCw className="inline mr-1" /> Rotate</span>
                      <span>{rotation}°</span>
                    </div>
                    <input type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span><FiSun className="inline mr-1" /> Brightness</span>
                      <span>{filters.brightness}%</span>
                    </div>
                    <input type="range" min={50} max={150} step={1} value={filters.brightness} onChange={(e) => setFilters(f => ({ ...f, brightness: Number(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
                  </div>
                </div>

                {/* Quick Action Tools */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer flex items-center gap-1">
                      <FiRotateCcw size={12} /> -90°
                    </button>
                    <button type="button" onClick={() => setRotation(r => (r + 90) % 360)} className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer flex items-center gap-1">
                      <FiRotateCw size={12} /> +90°
                    </button>
                    <button type="button" onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${flip.horizontal ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Flip Horiz
                    </button>
                    <button type="button" onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${flip.vertical ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Flip Vert
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleReset} className="text-xs font-bold text-gray-500 hover:text-gray-800 underline transition cursor-pointer">
                      Reset All
                    </button>
                    <button type="button" onClick={handleGeneratePreview} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer flex items-center gap-1">
                      <FiEye size={13} /> Preview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition">
              Cancel
            </button>
            <button type="button" onClick={handleSaveCrop} disabled={saving} className="px-6 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-amber-500 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
              {saving ? <><FiRefreshCw className="animate-spin" /> Optimizing Image...</> : <><FiCheck /> Save Cropped Image</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BannerCropperModal;
