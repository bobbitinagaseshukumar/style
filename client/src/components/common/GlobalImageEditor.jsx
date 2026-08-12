import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiRotateCw, FiRotateCcw, FiZoomIn, FiZoomOut,
  FiCheck, FiRefreshCw, FiCrop, FiUploadCloud, FiImage
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

/* ─── Canvas helpers ─────────────────────────────────────────── */

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }, quality = 0.92) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}

/* ─── Default aspect ratio presets ───────────────────────────── */

const DEFAULT_PRESETS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:1', value: 3 / 1 },
];

/* ─── File validation ────────────────────────────────────────── */

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file, maxSize = MAX_FILE_SIZE) => {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported format. Please select JPG, PNG, or WEBP.';
  if (file.size > maxSize) return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
  return null;
};

/**
 * GlobalImageEditor — Unified image editor modal used across the entire admin portal.
 * 
 * Props:
 * @param {boolean} isOpen — whether the modal is visible
 * @param {function} onClose — called when modal is dismissed (no save)
 * @param {function} onComplete — called with (url, blob) after successful crop + upload
 * @param {string} [imageSrc] — pre-loaded image to edit (data URL or remote URL)
 * @param {number|null} [aspectRatio=1] — default aspect ratio (null = free crop)
 * @param {Array} [aspectPresets] — array of {label, value} for aspect buttons
 * @param {boolean} [enableFreeCrop=true] — show "Free" crop option
 * @param {boolean} [enableRotation=true] — show rotation controls
 * @param {boolean} [enableFlip=true] — show flip buttons
 * @param {boolean} [enableZoom=true] — show zoom slider
 * @param {number} [maxFileSize=10MB] — max upload file size in bytes
 * @param {number} [outputQuality=0.92] — output image quality 0-1
 * @param {string} [title='Image Editor'] — modal title
 * @param {boolean} [uploadOnApply=true] — auto-upload to Cloudinary on Apply
 * @param {boolean} [showFileSelect=true] — show file picker if no imageSrc
 */
const GlobalImageEditor = ({
  isOpen,
  onClose,
  onComplete,
  imageSrc: initialImageSrc = null,
  aspectRatio: defaultAspect = 1,
  aspectPresets = null,
  enableFreeCrop = true,
  enableRotation = true,
  enableFlip = true,
  enableZoom = true,
  maxFileSize = MAX_FILE_SIZE,
  outputQuality = 0.92,
  title = 'Image Editor',
  uploadOnApply = true,
  showFileSelect = true,
}) => {
  const [imageSrc, setImageSrc] = useState(initialImageSrc);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(defaultAspect);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Sync imageSrc from parent
  useEffect(() => {
    setImageSrc(initialImageSrc || null);
  }, [initialImageSrc]);

  // Reset editor controls when modal opens (but NOT croppedAreaPixels — let react-easy-crop set it)
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFlip({ horizontal: false, vertical: false });
      setAspect(defaultAspect);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen, defaultAspect]);

  // Build presets
  const presets = aspectPresets || DEFAULT_PRESETS.filter(p => {
    if (p.value === null) return enableFreeCrop;
    return true;
  });

  // Callbacks
  const onCropChange = useCallback((c) => setCrop(c), []);
  const onZoomChange = useCallback((z) => setZoom(z), []);
  const onCropCompleteCallback = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // File select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file, maxFileSize);
    if (error) { toast.error(error); return; }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Reset
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlip({ horizontal: false, vertical: false });
    setAspect(defaultAspect);
  };

  // Apply & Upload
  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setUploading(true);
      setUploadProgress(10);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip, outputQuality);
      if (!croppedBlob) {
        toast.error('Failed to generate cropped image. Please try another image.');
        return;
      }
      setUploadProgress(40);

      if (uploadOnApply) {
        const formData = new FormData();
        formData.append('image', croppedBlob, `edited-${Date.now()}.webp`);
        try {
          const { data } = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              if (e.total) setUploadProgress(40 + Math.round((e.loaded / e.total) * 55));
            },
          });
          setUploadProgress(100);
          if (data?.url) {
            onComplete(data.url, croppedBlob);
            toast.success('Image edited & uploaded!');
            onClose();
          } else {
            toast.error('Image uploaded, but no URL was returned. Please try again.');
          }
        } catch (err) {
          console.error('[UPLOAD ERROR]', err);
          toast.error('Image upload failed. Please try again.');
        }
      } else {
        // Return blob directly without uploading
        const objectUrl = URL.createObjectURL(croppedBlob);
        onComplete(objectUrl, croppedBlob);
        // Don't call onClose here — onComplete handler (e.g. handleCropDone) already closes via state
      }
    } catch (err) {
      console.error('[CROP ERROR]', err);
      toast.error('Unable to edit this image. Please try another image.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Cancel
  const handleCancel = () => {
    setImageSrc(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget && !uploading) handleCancel(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 16px)' }}
        >
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FiCrop className="text-amber-500 w-5 h-5 shrink-0" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{title}</h3>
            </div>
            <button onClick={handleCancel} disabled={uploading}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition shrink-0 disabled:opacity-50">
              <FiX size={18} />
            </button>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!imageSrc && showFileSelect ? (
              /* ─── File Upload Zone ─── */
              <div className="p-6">
                <div
                  className="border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-10 sm:p-12 text-center transition-colors bg-gray-50/50 relative cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-400', 'bg-amber-50/30'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30');
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const error = validateFile(file, maxFileSize);
                      if (error) { toast.error(error); return; }
                      const reader = new FileReader();
                      reader.onload = () => setImageSrc(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileSelect} className="hidden" />
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <FiUploadCloud size={32} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Click or Drag & Drop Image Here</p>
                  <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP · Max {Math.round(maxFileSize / 1024 / 1024)}MB</p>
                </div>
              </div>
            ) : imageSrc ? (
              /* ─── Cropper + Controls ─── */
              <div className="flex flex-col">
                {/* Crop Area */}
                <div className="relative w-full bg-slate-900" style={{ height: 'min(55vh, 400px)', minHeight: '220px' }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteCallback}
                    cropShape="rect"
                    showGrid={true}
                    style={{
                      containerStyle: { background: '#0f172a' },
                      cropAreaStyle: {
                        border: '3px solid white',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                      },
                    }}
                  />
                </div>

                {/* Controls Panel */}
                <div className="p-3 sm:p-4 space-y-3 border-t border-gray-100 bg-gray-50/50">
                  {/* Aspect Ratio */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Aspect Ratio</p>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setAspect(p.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            aspect === p.value
                              ? 'bg-amber-400 text-black shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom */}
                  {enableZoom && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Zoom</p>
                        <span className="text-[10px] text-gray-400 font-mono">{zoom.toFixed(1)}x</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition shrink-0">
                          <FiZoomOut size={14} />
                        </button>
                        <input type="range" min={1} max={3} step={0.05} value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-amber-500
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                        />
                        <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition shrink-0">
                          <FiZoomIn size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rotate + Flip + Reset Row */}
                  <div className="flex flex-wrap gap-1.5">
                    {enableRotation && (
                      <>
                        <button type="button" onClick={() => setRotation(r => r - 90)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                          title="Rotate Left 90°">
                          <FiRotateCcw size={13} /> <span className="hidden xs:inline">Rotate Left</span><span className="xs:hidden">↶</span>
                        </button>
                        <button type="button" onClick={() => setRotation(r => r + 90)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                          title="Rotate Right 90°">
                          <FiRotateCw size={13} /> <span className="hidden xs:inline">Rotate Right</span><span className="xs:hidden">↷</span>
                        </button>
                      </>
                    )}
                    {enableFlip && (
                      <>
                        <button type="button" onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            flip.horizontal ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-200 hover:bg-gray-100'
                          }`}
                          title="Flip Horizontal">
                          ↔ <span className="hidden sm:inline">Flip H</span>
                        </button>
                        <button type="button" onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            flip.vertical ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-200 hover:bg-gray-100'
                          }`}
                          title="Flip Vertical">
                          ↕ <span className="hidden sm:inline">Flip V</span>
                        </button>
                      </>
                    )}
                    <button type="button" onClick={handleReset}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-amber-600 hover:bg-amber-50 transition cursor-pointer ml-auto"
                      title="Reset all edits">
                      <FiRefreshCw size={13} /> Reset
                    </button>
                  </div>

                  {/* Choose Different Photo */}
                  {showFileSelect && (
                    <button type="button"
                      onClick={() => { setImageSrc(null); fileInputRef.current?.click(); }}
                      className="text-xs text-amber-600 font-semibold hover:underline cursor-pointer">
                      ← Choose Different Photo
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* ─── Footer ─── */}
          {imageSrc && (
            <div className="shrink-0 px-4 sm:px-5 py-3.5 border-t border-gray-100 bg-white">
              {/* Upload Progress */}
              {uploading && uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-center">
                    {uploadProgress < 40 ? 'Processing image...' : uploadProgress < 95 ? 'Uploading...' : 'Finalizing...'}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={handleCancel} disabled={uploading}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleApply} disabled={uploading}
                  className="px-6 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                  {uploading ? (
                    <><FiRefreshCw className="animate-spin" size={13} /> Saving...</>
                  ) : (
                    <><FiCheck size={14} /> Apply & Upload</>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalImageEditor;
