import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiCrop, FiTrash2, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import GlobalImageEditor from './GlobalImageEditor';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

/**
 * ImageUploadWithEditor — Reusable image upload field with built-in crop editor.
 *
 * Shows either:
 *   - An upload dropzone (when no image)
 *   - A thumbnail with Edit / Remove buttons (when image exists)
 *
 * Props:
 * @param {string} value — current image URL
 * @param {function} onChange — called with (newUrl) after edit/upload
 * @param {number|null} [aspectRatio=1] — default aspect ratio
 * @param {Array} [aspectPresets] — custom aspect buttons
 * @param {string} [placeholder='Upload Image'] — dropzone text
 * @param {string} [editorTitle='Image Editor'] — modal title
 * @param {string} [className] — extra container classes
 * @param {boolean} [required=false] — show asterisk
 * @param {string} [label] — field label
 * @param {string} [hint] — help text below dropzone
 * @param {number} [maxFileSize=10MB] — max file size
 * @param {boolean} [compact=false] — use compact layout for small spaces
 */
const ImageUploadWithEditor = ({
  value,
  onChange,
  aspectRatio = 1,
  aspectPresets = null,
  placeholder = 'Upload Image',
  editorTitle = 'Image Editor',
  className = '',
  required = false,
  label = '',
  hint = '',
  maxFileSize = 10 * 1024 * 1024,
  compact = false,
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSrc, setEditorSrc] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Unsupported format. Please select JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > maxFileSize) {
      toast.error(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditorSrc(reader.result);
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEditExisting = () => {
    if (value) {
      setEditorSrc(value);
      setEditorOpen(true);
    }
  };

  const handleEditorComplete = (url) => {
    onChange(url);
    setEditorSrc(null);
  };

  const handleRemove = () => {
    if (confirmDelete) {
      onChange('');
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        /* ─── Image Preview ─── */
        <div className={`relative group rounded-2xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center ${compact ? 'h-24' : 'h-36'}`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          {/* Overlay controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleEditExisting}
              className="px-3 py-2 rounded-xl bg-white/90 text-gray-800 text-xs font-bold hover:bg-white transition flex items-center gap-1.5"
            >
              <FiCrop size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="px-3 py-2 rounded-xl bg-white/90 text-gray-800 text-xs font-bold hover:bg-white transition flex items-center gap-1.5"
            >
              <FiUploadCloud size={12} /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-red-600 hover:bg-red-50'
              }`}
            >
              <FiTrash2 size={12} /> {confirmDelete ? 'Confirm?' : 'Remove'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={(e) => { handleFileSelect(e.target.files?.[0]); e.target.value = ''; }}
          />
        </div>
      ) : (
        /* ─── Upload Dropzone ─── */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-400', 'bg-amber-50/30'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-amber-400', 'bg-amber-50/30');
            handleFileSelect(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-2xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-white flex flex-col items-center justify-center text-center transition cursor-pointer ${
            compact ? 'h-24 p-3' : 'h-36 p-4'
          }`}
        >
          <FiUploadCloud size={compact ? 18 : 24} className="text-amber-500 mb-1" />
          <span className="text-xs font-bold text-gray-800">{placeholder}</span>
          {hint && <span className="text-[10px] text-gray-400 mt-0.5">{hint}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={(e) => { handleFileSelect(e.target.files?.[0]); e.target.value = ''; }}
          />
        </div>
      )}

      {/* Global Image Editor Modal */}
      <GlobalImageEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditorSrc(null); }}
        onComplete={handleEditorComplete}
        imageSrc={editorSrc}
        aspectRatio={aspectRatio}
        aspectPresets={aspectPresets}
        maxFileSize={maxFileSize}
        title={editorTitle}
        showFileSelect={false}
      />
    </div>
  );
};

export default ImageUploadWithEditor;
