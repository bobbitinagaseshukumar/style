import React from 'react';
import { FiGlobe, FiEye, FiHome, FiCheck } from 'react-icons/fi';

const STATUSES = [
  { key: 'published', label: 'Published', desc: 'Live on website, searchable & purchasable', emoji: '✅' },
  { key: 'draft', label: 'Draft', desc: 'Only visible to Admin', emoji: '📝' },
  { key: 'hidden', label: 'Hidden', desc: 'Hidden from website storefront', emoji: '👁️' },
  { key: 'archived', label: 'Archived', desc: 'Stored for future use', emoji: '📦' },
];

const BADGES = [
  { key: 'featured', label: 'Featured Product', desc: 'Show in Homepage Featured section', emoji: '⭐' },
  { key: 'trending', label: 'Trending Product', desc: 'Show in Trending Now section', emoji: '🔥' },
  { key: 'newArrival', label: 'New Arrival', desc: 'Show in New Arrivals section', emoji: '✨' },
  { key: 'bestSeller', label: 'Best Seller', desc: 'Show in Best Sellers section', emoji: '🏆' },
  { key: 'isRecommended', label: 'Recommended Choice', desc: 'Show in Recommended for You', emoji: '💎' },
  { key: 'isPremium', label: 'Premium Collection', desc: 'Show in Luxury Collection', emoji: '👑' },
  { key: 'isFestival', label: 'Festival Collection', desc: 'Show in Festive Deals', emoji: '🪔' },
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
        <h2 className="text-xl font-bold text-gray-900">Publishing, Homepage & Visibility Controls</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage product publishing status, homepage section placement, and search visibility</p>
      </div>

      {/* Publishing Status */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">1. Publishing Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STATUSES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange('status', s.key)}
              className={`p-4 rounded-xl border-2 text-left transition cursor-pointer
                ${form.status === s.key
                  ? 'border-yellow-400 bg-yellow-50/80 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="text-2xl mb-2">{s.emoji}</div>
              <p className="font-bold text-gray-900 text-sm">{s.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Home Page Display Toggle */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent rounded-2xl p-5 border border-amber-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-md">
              <FiHome size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Home Page Visibility Control</h3>
              <p className="text-xs text-gray-600 mt-0.5 max-w-xl">
                When enabled, this product appears in Home Page sections. Disabling it removes it <strong>ONLY from the Home Page</strong> while keeping it visible in Category, Subcategory, Search & Product detail pages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('showOnHomepage', !form.showOnHomepage)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm ${
              form.showOnHomepage
                ? 'bg-amber-400 text-black shadow-amber-400/20'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {form.showOnHomepage ? <><FiCheck /> Visible on Home Page</> : 'Hidden from Home Page'}
          </button>
        </div>
      </div>

      {/* Section Badges */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">2. Section Placement & Badges</h3>
        <p className="text-xs text-gray-400">Select which storefront sections this product appears in. One product can belong to multiple sections.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BADGES.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => toggleBadge(b.key)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition cursor-pointer
                ${form[b.key]
                  ? 'border-yellow-400 bg-yellow-50/80 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base ${form[b.key] ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-100'}`}>
                {b.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-xs truncate">{b.label}</p>
                <p className="text-[10px] text-gray-500 truncate">{b.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                ${form[b.key] ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300'}`}>
                {form[b.key] && <span className="text-black text-[10px] font-black">✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SEO & Slug */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
        <div className="flex items-center gap-2">
          <FiGlobe size={15} className="text-yellow-500" />
          <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">3. SEO Settings</h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">SEO Title</label>
          <input type="text" value={form.seoTitle} onChange={handle('seoTitle')}
            placeholder={form.name || 'Product name — StyleVerse'}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Meta Description</label>
          <textarea value={form.seoDescription} onChange={handle('seoDescription')}
            placeholder="Brief description for search engine results..."
            rows={2}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none bg-white" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-mono shrink-0">/product/</span>
            <input type="text" value={form.slug || autoSlug} onChange={handle('slug')}
              placeholder={autoSlug}
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusStep;
