import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiUpload, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import GlobalImageEditor from '../../../components/common/GlobalImageEditor';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const DEFAULT_COLOR = {
  name: '',
  hex: '#000000',
  images: [],
  price: '',
  discountPercent: '0',
  stock: '',
  sku: '',
  status: 'active',
  sizes: [], // [{size, stock, sku}]
};

const ColorVariantCard = ({ color, index, availableSizes, onChange, onRemove, isExpanded, onToggle }) => {
  const fileRef = useRef();
  const [cropSrc, setCropSrc] = useState(null);

  const handleFiles = async (files) => {
    if (color.images.length >= 8) return;
    const file = Array.from(files).find(f => ACCEPTED.includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setCropSrc(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleCropDone = ({ url, blob }) => {
    onChange({ ...color, images: [...color.images, { id: Date.now(), url, blob }] });
    setCropSrc(null);
  };

  const removeImage = (id) => onChange({ ...color, images: color.images.filter(i => i.id !== id) });

  const updateSize = (size, field, value) => {
    const existing = color.sizes.find(s => s.size === size);
    if (existing) {
      onChange({ ...color, sizes: color.sizes.map(s => s.size === size ? { ...s, [field]: value } : s) });
    } else {
      onChange({ ...color, sizes: [...color.sizes, { size, stock: '', sku: '', [field]: value }] });
    }
  };

  const getSizeData = (size) => color.sizes.find(s => s.size === size) || { size, stock: '', sku: '' };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition ${isExpanded ? 'border-yellow-400' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Color Header */}
      <div
        className={`flex items-center gap-4 px-5 py-4 cursor-pointer ${isExpanded ? 'bg-yellow-50' : 'bg-white hover:bg-gray-50'}`}
        onClick={onToggle}
      >
        {/* Color Swatch Input */}
        <div className="flex items-center gap-3 flex-1">
          <input
            type="color"
            value={color.hex}
            onChange={e => onChange({ ...color, hex: e.target.value })}
            onClick={e => e.stopPropagation()}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={color.name}
            onChange={e => onChange({ ...color, name: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Color name (e.g. Midnight Black)"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
          <span>{color.images.length} img</span>
          <span>{color.sizes.filter(s => s.stock).length} sizes</span>
          <span>{color.stock || '—'} total</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
            <FiTrash2 size={13} />
          </button>
          {isExpanded ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 bg-white border-t border-gray-100">

              {/* Color Images */}
              <div>
                <p className="text-sm font-bold text-gray-700 mt-4 mb-2">Color Images</p>
                <div className="flex gap-2 flex-wrap">
                  {color.images.map((img, i) => (
                    <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        <FiX size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {color.images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-yellow-300 hover:text-yellow-500 hover:bg-yellow-50 transition"
                    >
                      <FiUpload size={14} />
                      <span className="text-[9px] mt-0.5">Add</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={e => handleFiles(e.target.files)} />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹)</label>
                  <input type="number" value={color.price} onChange={e => onChange({ ...color, price: e.target.value })}
                    placeholder="999" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Discount %</label>
                  <input type="number" value={color.discountPercent} onChange={e => onChange({ ...color, discountPercent: e.target.value })}
                    placeholder="0" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Total Stock</label>
                  <input type="number" value={color.stock} onChange={e => onChange({ ...color, stock: e.target.value })}
                    placeholder="100" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">SKU</label>
                  <input type="text" value={color.sku} onChange={e => onChange({ ...color, sku: e.target.value })}
                    placeholder="AUTO" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                </div>
              </div>

              {/* Size-wise Inventory */}
              {availableSizes?.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">Size-Wise Stock for <span style={{ color: color.hex }}>{color.name || 'this color'}</span></p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider rounded-tl-lg">Size</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider rounded-tr-lg">SKU (optional)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {availableSizes.map(size => {
                          const sd = getSizeData(size);
                          return (
                            <tr key={size} className="hover:bg-yellow-50/50 transition">
                              <td className="px-3 py-2">
                                <span className="font-bold text-gray-800 px-2 py-1 bg-gray-100 rounded-lg">{size}</span>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={sd.stock}
                                  onChange={e => updateSize(size, 'stock', e.target.value)}
                                  placeholder="0"
                                  className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-yellow-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={sd.sku}
                                  onChange={e => updateSize(size, 'sku', e.target.value)}
                                  placeholder={`${color.sku || 'SKU'}-${size}`}
                                  className="w-40 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-yellow-400 focus:outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal for this color */}
      <GlobalImageEditor
        isOpen={!!cropSrc}
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        onComplete={(url, blob) => handleCropDone({ url, blob })}
        aspectRatio={1}
        aspectPresets={[
          { label: 'Free', value: null },
          { label: '1:1', value: 1 },
          { label: '3:4', value: 3/4 },
          { label: '4:3', value: 4/3 },
        ]}
        title="Edit Color Image"
        uploadOnApply={false}
        showFileSelect={false}
      />
    </div>
  );
};

/* ─── Colors Step ────────────────────────────────────────────── */
const ColorsStep = ({ colors, setColors, availableSizes }) => {
  const [expandedIdx, setExpandedIdx] = useState(0);

  const addColor = () => {
    const newColor = { ...DEFAULT_COLOR, id: Date.now() };
    setColors(prev => [...prev, newColor]);
    setExpandedIdx(colors.length);
  };

  const updateColor = (idx, updated) => {
    setColors(prev => prev.map((c, i) => i === idx ? updated : c));
  };

  const removeColor = (idx) => {
    setColors(prev => prev.filter((_, i) => i !== idx));
    if (expandedIdx >= idx) setExpandedIdx(Math.max(0, expandedIdx - 1));
  };

  const totalStock = colors.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Color Variants</h2>
          <p className="text-sm text-gray-500 mt-0.5">One product, multiple colours. Each colour has its own images, stock, and size breakdown.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{totalStock}</p>
        </div>
      </div>

      {/* Summary chips */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <button
              key={c.id || i}
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition
                ${expandedIdx === i ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-200 text-gray-700 hover:border-yellow-300'}`}
            >
              <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
              {c.name || `Color ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Color Cards */}
      <div className="space-y-3">
        {colors.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 font-medium mb-2">No colors added yet</p>
            <p className="text-sm text-gray-400">Add at least one color variant to continue</p>
          </div>
        )}
        <AnimatePresence>
          {colors.map((color, idx) => (
            <motion.div
              key={color.id || idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ColorVariantCard
                color={color}
                index={idx}
                availableSizes={availableSizes}
                onChange={(updated) => updateColor(idx, updated)}
                onRemove={() => removeColor(idx)}
                isExpanded={expandedIdx === idx}
                onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addColor}
          className="w-full py-3 border-2 border-dashed border-yellow-300 rounded-2xl text-yellow-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-50 hover:border-yellow-400 transition"
        >
          <FiPlus size={16} /> Add Color Variant
        </button>
      </div>
    </div>
  );
};

export default ColorsStep;
