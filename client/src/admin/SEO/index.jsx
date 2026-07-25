import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FiGlobe, FiExternalLink, FiCheck, FiSave, FiCode } from 'react-icons/fi';
import { toast } from 'react-toastify';

const pageOptions = [
  { slug: 'home', name: 'Homepage' },
  { slug: 'categories', name: 'Categories Store Page' },
  { slug: 'about-us', name: 'About Us Page' },
  { slug: 'contact-us', name: 'Contact Us Page' },
  { slug: 'faq', name: 'FAQ Knowledge Base' },
];

const AdminSEO = () => {
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const { data } = await api.get('/seo/settings');
        const found = (data.data || []).find(s => s.pageSlug === selectedSlug);
        if (found) {
          setMetaTitle(found.metaTitle || '');
          setMetaDescription(found.metaDescription || '');
          setKeywords(found.keywords || '');
        } else {
          setMetaTitle('StyleVerse - Luxury Saree & Jewellery House');
          setMetaDescription('Shop handcrafted Banarasi silk sarees, Kundan bridal jewellery, designer kurtis and traditional wear.');
          setKeywords('Saree, Silk, Kundan Jewellery, StyleVerse');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSEO();
  }, [selectedSlug]);

  const handleSaveSEO = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/seo/settings', {
        pageSlug: selectedSlug,
        metaTitle,
        metaDescription,
        keywords,
      });
      toast.success(`SEO settings for '${selectedSlug}' saved!`);
    } catch (err) {
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO & Sitemap Manager</h1>
          <p className="text-sm text-gray-500">Configure page meta tags, OpenGraph attributes, and preview auto-generated XML sitemap</p>
        </div>
        <div className="flex gap-2">
          <a
            href="http://localhost:5000/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <FiCode /> View sitemap.xml <FiExternalLink />
          </a>
          <a
            href="http://localhost:5000/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <FiGlobe /> View robots.txt <FiExternalLink />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selector Sidebar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 h-fit">
          <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Target Page</span>
          {pageOptions.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedSlug(p.slug)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                selectedSlug === p.slug ? 'bg-gold-50 text-gold-700 font-bold border border-gold-200' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* SEO Editor Form */}
        <form onSubmit={handleSaveSEO} className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-charcoal-900 border-b pb-3 uppercase">Meta Tags Configurator</h3>

          <Input
            label="Meta Title (Max 60 chars)"
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            required
            maxLength={70}
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Meta Description (Max 160 chars)</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              required
              maxLength={170}
              className="w-full p-3 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none"
            />
          </div>

          <Input
            label="Focus Keywords (Comma separated)"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="Saree, Kundan Jewellery, Silk"
          />

          {/* SERP Google Live Preview */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Google SERP Preview</span>
            <div className="text-blue-800 text-sm font-semibold hover:underline cursor-pointer">{metaTitle || 'Page Title'}</div>
            <div className="text-emerald-700 text-[11px]">https://styleverse.com/{selectedSlug === 'home' ? '' : selectedSlug}</div>
            <div className="text-gray-600 text-xs line-clamp-2">{metaDescription || 'Meta description preview snippet.'}</div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} icon={FiSave}>
              Save Meta Tags
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSEO;
