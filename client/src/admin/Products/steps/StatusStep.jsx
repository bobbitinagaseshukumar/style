import React from 'react';
import { FiGlobe, FiCheckSquare, FiEye } from 'react-icons/fi';

const STATUSES = [
  { key: 'draft', label: 'Draft', desc: 'Not visible to customers', emoji: '📝', color: 'gray' },
  { key: 'published', label: 'Published', desc: 'Live on the website', emoji: '✅', color: 'green' },
  { key: 'hidden', label: 'Hidden', desc: 'Created but invisible', emoji: '👁️', color: 'blue' },
];

const BADGES = [
  { key: 'featured', label: 'Featured', desc: 'Show on Homepage Featured section', emoji: '⭐' },
  { key: 'trending', label: 'Trending Now', desc: 'Show in Trending section', emoji: '🔥' },
  { key: 'newArrival', label: 'New Arrival', desc: 'Show in New Arrivals', emoji: '✨' },
  { key: 'bestSeller', label: 'Best Seller', desc: 'Show in Best Sellers', emoji: '🏆' },
  { key: 'flashSale', label: 'Flash Sale', desc: 'Show Flash Sale badge', emoji: '⚡' },
  { key: 'limitedStock', label: 'Limited Stock', desc: 'Show Limited Stock badge', emoji: '🔔' },
];

const StatusStep = ({ form, onChange }) => {
  const handle = (key) => (e) => onChange(key, e.target.value);
  const toggleBadge = (key) => onChange(key, !form[key]);

  const autoSlug = form.name
    ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : '';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Status, Badges & SEO</h2>
        <p className="text-sm text-gray-500 mt-0.5">Control visibility, homepage placement, and search engine optimization</p>
      </div>

      {/* Status */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Product Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUSES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange('status', s.key)}
              className={`p-4 rounded-xl border-2 text-left transition
                ${form.status === s.key
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="text-2xl mb-2">{s.emoji}</div>
              <p className="font-bold text-gray-800 text-sm">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Homepage Badges */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Homepage & Badges</h3>
        <p className="text-xs text-gray-400">Select which sections this product appears in. Multiple badges allowed.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGES.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => toggleBadge(b.key)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition
                ${form[b.key]
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${form[b.key] ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                {b.emoji}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{b.label}</p>
                <p className="text-[11px] text-gray-500">{b.desc}</p>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${form[b.key] ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300'}`}>
                {form[b.key] && <span className="text-black text-xs font-black">✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FiGlobe size={15} className="text-yellow-500" />
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">SEO Settings</h3>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">SEO Title</label>
          <input type="text" value={form.seoTitle} onChange={handle('seoTitle')}
            placeholder={form.name || 'Product name — StyleVerse | Fashion Store'}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          <p className="text-xs text-gray-400 mt-1">{(form.seoTitle || '').length}/60 characters (ideal: under 60)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description</label>
          <textarea value={form.seoDescription} onChange={handle('seoDescription')}
            placeholder="Brief description for Google search results. Include key features and keywords."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none" />
          <p className="text-xs text-gray-400 mt-1">{(form.seoDescription || '').length}/160 characters (ideal: 120-160)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Keywords</label>
          <input type="text" value={form.seoKeywords} onChange={handle('seoKeywords')}
            placeholder="e.g. silk saree, designer saree, wedding saree, banarasi saree"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-mono flex-shrink-0">/products/</span>
            <input type="text" value={form.slug || autoSlug} onChange={handle('slug')}
              placeholder={autoSlug}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          </div>
        </div>

        {/* Live Google Preview */}
        {(form.name || form.seoTitle) && (
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FiEye size={11}/>Google Preview</p>
            <p className="text-[#1a0dab] text-sm font-medium hover:underline cursor-pointer leading-tight">
              {form.seoTitle || form.name || 'Product Name'} — StyleVerse
            </p>
            <p className="text-xs text-[#006621] mt-0.5">https://styleverse.com/products/{form.slug || autoSlug || 'product-slug'}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
              {form.seoDescription || form.shortDesc || 'Product description will appear here in Google search results.'}
            </p>
          </div>
        )}
      </div>

      {/* Return Policy */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Return & Refund Policy</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Return Period</label>
            <input type="text" value={form.returnPeriod} onChange={handle('returnPeriod')}
              placeholder="e.g. 7 days"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Policy</label>
            <input type="text" value={form.refundPolicy} onChange={handle('refundPolicy')}
              placeholder="e.g. Full refund within 7 days"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusStep;
