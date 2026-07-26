import React, { useState, useEffect } from 'react';
import { FiPlus, FiX, FiTag } from 'react-icons/fi';
import api from '../../../config/api';

const SIZES_PRESET = [
  { group: 'Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'] },
  { group: 'Footwear (EU)', sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
  { group: 'Kids', sizes: ['0-3M', '3-6M', '6-12M', '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '12Y', '14Y'] },
  { group: 'Jewellery', sizes: ['One Size', 'Adjustable', 'S', 'M', 'L'] },
];

const TagInput = ({ tags, onChange, placeholder, suggestions = [] }) => {
  const [input, setInput] = useState('');

  const add = (val) => {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };

  const remove = (t) => onChange(tags.filter(x => x !== t));

  return (
    <div>
      <div className="flex flex-wrap gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-yellow-400 transition">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-lg">
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:text-red-500 transition"><FiX size={10}/></button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm text-gray-700 bg-transparent"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.filter(s => !tags.includes(s)).slice(0, 12).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...tags, s])}
              className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700 transition font-medium"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryStep = ({ form, onChange }) => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data || [])).finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (!form.categoryId) { setSubCategories([]); return; }
    setLoadingSubs(true);
    api.get(`/subcategories?categoryId=${form.categoryId}&activeOnly=true`)
      .then(({ data }) => setSubCategories(data.data || []))
      .catch(() => setSubCategories([]))
      .finally(() => setLoadingSubs(false));
  }, [form.categoryId]);

  const TAG_SUGGESTIONS = [
    'Trending', 'Summer', 'Winter', 'Festival', 'Premium', 'Casual', 'Formal',
    'Wedding', 'Cotton', 'Party Wear', 'New Arrival', 'Best Seller', 'Ethnic',
    'Traditional', 'Modern', 'Handcrafted', 'Bridal', 'Sale', 'Limited Edition'
  ];

  const SIZE_GROUPS = SIZES_PRESET;

  const toggleSize = (size) => {
    const current = form.availableSizes || [];
    onChange('availableSizes', current.includes(size) ? current.filter(s => s !== size) : [...current, size]);
  };

  const handleCategoryChange = (e) => {
    onChange('categoryId', e.target.value);
    onChange('subCategoryId', '');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Category & Classification</h2>
        <p className="text-sm text-gray-500 mt-0.5">Choose the right category so customers can find your product easily</p>
      </div>

      {/* Category & Subcategory */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Category</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-400">*</span></label>
            {loadingCats ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={form.categoryId}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subcategory <span className="text-red-400">*</span></label>
            {loadingSubs ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={form.subCategoryId}
                onChange={e => onChange('subCategoryId', e.target.value)}
                disabled={!form.categoryId || subCategories.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white disabled:opacity-50"
              >
                <option value="">{subCategories.length === 0 && form.categoryId ? 'No subcategories — add in Category Manager' : 'Select subcategory'}</option>
                {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Category visual preview */}
        {form.categoryId && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Selected path:</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full">
              {categories.find(c => c.id === form.categoryId)?.name}
              {form.subCategoryId && (
                <>
                  <span className="text-yellow-400 mx-1">›</span>
                  {subCategories.find(s => s.id === form.subCategoryId)?.name}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Available Sizes */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Available Sizes <span className="text-red-400 font-normal normal-case text-xs ml-1">*required</span></h3>
        <p className="text-xs text-gray-400">Select all sizes available for this product. Each color variant can have individual stock per size.</p>

        {SIZE_GROUPS.map(group => (
          <div key={group.group}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{group.group}</p>
            <div className="flex flex-wrap gap-2">
              {group.sizes.map(size => {
                const active = (form.availableSizes || []).includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition
                      ${active ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-200 text-gray-600 hover:border-yellow-300 hover:bg-yellow-50'}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Custom size input */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Custom Size</p>
          <TagInput
            tags={(form.availableSizes || []).filter(s => !SIZES_PRESET.flatMap(g => g.sizes).includes(s))}
            onChange={(custom) => {
              const preset = (form.availableSizes || []).filter(s => SIZES_PRESET.flatMap(g => g.sizes).includes(s));
              onChange('availableSizes', [...preset, ...custom]);
            }}
            placeholder="Type custom size and press Enter..."
          />
        </div>

        {(form.availableSizes || []).length > 0 && (
          <p className="text-xs text-green-600 font-semibold">✓ {(form.availableSizes || []).length} sizes selected: {(form.availableSizes || []).join(', ')}</p>
        )}
      </div>

      {/* Tags */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Product Tags</h3>
        <p className="text-xs text-gray-400">Tags improve search visibility. Press Enter or comma to add a tag.</p>
        <TagInput
          tags={form.tags || []}
          onChange={tags => onChange('tags', tags)}
          placeholder="Type a tag and press Enter..."
          suggestions={TAG_SUGGESTIONS}
        />
      </div>
    </div>
  );
};

export default CategoryStep;
