import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiRotateCw, FiZoomIn, FiCheck, FiRefreshCw,
  FiCrop, FiUploadCloud, FiImage, FiMaximize2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

/* Helper to generate cropped image Blob from Canvas */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedBBox(image.width, image.height, rotation);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/webp', 0.9);
  });
}

function getRotatedBBox(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

const ImageCropperModal = ({ isOpen, onClose, onCropComplete, title = 'Crop Image', aspectPreset = 1 }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(aspectPreset);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const onRotationChange = (rotation) => setRotation(rotation);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // File Select / Drag & Drop
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds maximum limit of 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip);

      if (!croppedBlob) {
        toast.error('Failed to generate cropped image');
        return;
      }

      // Upload Blob to Backend / Cloudinary
      const formData = new FormData();
      formData.append('image', croppedBlob, `category-crop-${Date.now()}.webp`);

      let finalUrl = '';
      try {
        const { data } = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalUrl = data.url;
      } catch (err) {
        // Fallback: Create Object URL if upload route unavailable
        finalUrl = URL.createObjectURL(croppedBlob);
      }

      onCropComplete(finalUrl, croppedBlob);
      toast.success('Image cropped & saved!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error processing image crop');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <FiCrop className="text-amber-500 w-5 h-5" />
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 transition">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {!imageSrc ? (
            /* Upload Zone */
            <div className="border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-10 text-center transition-colors bg-gray-50/50 relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <FiUploadCloud size={32} />
              </div>
              <p className="font-bold text-gray-900 text-sm mb-1">Click or Drag & Drop Image Here</p>
              <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP (Max 10 MB)</p>
            </div>
          ) : (
            /* Cropper Screen */
            <div className="space-y-4">
              <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={onCropChange}
                  onCropComplete={onCropCompleteCallback}
                  onZoomChange={onZoomChange}
                  onRotationChange={onRotationChange}
                />
              </div>

              {/* Aspect Ratio Buttons */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Aspect Ratio:</span>
                {[
                  { label: 'Square (1:1)', val: 1 },
                  { label: 'Landscape (16:9)', val: 16 / 9 },
                  { label: 'Portrait (3:4)', val: 3 / 4 },
                  { label: 'Banner (3:1)', val: 3 / 1 },
                ].map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => setAspect(a.val)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      aspect === a.val ? 'bg-amber-400 text-black shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Sliders & Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span><FiZoomIn className="inline mr-1" /> Zoom</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span><FiRotateCw className="inline mr-1" /> Rotate</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="text-amber-600 font-semibold hover:underline cursor-pointer"
                >
                  Choose Different Photo
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))}
                    className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                  >
                    Flip Horiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))}
                    className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                  >
                    Flip Vert
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {imageSrc && (
          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={uploading}
              className="px-6 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <><FiRefreshCw className="animate-spin" /> Saving Crop...</>
              ) : (
                <><FiCheck /> Save Cropped Image</>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ImageCropperModal;
