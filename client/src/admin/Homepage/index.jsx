import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../config/api';
import {
  FiPlus, FiTrash2, FiEye, FiCheck, FiTag, FiZap, FiImage,
  FiHome, FiStar, FiTrendingUp, FiBox, FiLayers, FiCheckCircle
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const AdminHomepage = () => {
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'banners' | 'announcements' | 'flash'
  const [activeSection, setActiveSection] = useState('featured'); // 'featured' | 'trending' | 'newArrival' | 'bestSeller' | 'isRecommended' | 'isPremium'

  const [products, setProducts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [banners, setBanners] = useState([]);
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [annModal, setAnnModal] = useState(false);
  const [bannerModal, setBannerModal] = useState(false);

  // Forms
  const [annForm, setAnnForm] = useState({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
  const [flashForm, setFlashForm] = useState({ title: '', description: '', discountPercent: '30', hoursLeft: '24' });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [prodRes, annRes, banRes, flashRes] = await Promise.allSettled([
        api.get('/products?includeAll=true&limit=100'),
        api.get('/cms/announcements'),
        api.get('/cms/banners'),
        api.get('/cms/flash-sale'),
      ]);

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data?.data || []);
      if (banRes.status === 'fulfilled') setBanners(banRes.value.data?.data || []);
      if (flashRes.status === 'fulfilled' && flashRes.value.data?.data) {
        setFlashSale(flashRes.value.data.data);
        setFlashForm({
          title: flashRes.value.data.data.title || '',
          description: flashRes.value.data.description || '',
          discountPercent: flashRes.value.data.discountPercent || '30',
          hoursLeft: '24',
        });
      }
    } catch (err) {
      toast.error('Failed to load homepage manager data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // Toggle Show on Home Page (Removes ONLY from Home Page without deleting product)
  const handleToggleHomepageDisplay = async (product) => {
    const newValue = !product.showOnHomepage;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, showOnHomepage: newValue } : p));
    try {
      await api.put(`/products/${product.id}`, { showOnHomepage: newValue });
      toast.success(newValue ? `"${product.name}" added to Home Page!` : `"${product.name}" removed from Home Page (still in Catalog)`);
    } catch (err) {
      toast.error('Failed to update homepage visibility');
      fetchAllData();
    }
  };

  // Toggle Section Placement (Featured, Trending, New Arrival, Best Seller, Recommended, Premium)
  const handleToggleSection = async (product, sectionKey) => {
    const newValue = !product[sectionKey];
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [sectionKey]: newValue } : p));
    try {
      await api.put(`/products/${product.id}`, { [sectionKey]: newValue });
      toast.success(newValue ? `Added to ${sectionKey}!` : `Removed from ${sectionKey}`);
    } catch (err) {
      toast.error('Failed to update section badge');
      fetchAllData();
    }
  };

  // Announcement Handlers
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/announcements', annForm);
      toast.success('Announcement published to Home Page!');
      setAnnModal(false);
      setAnnForm({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });
      fetchAllData();
    } catch (err) { toast.error('Failed to create announcement'); }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/cms/announcements/${id}`);
      toast.success('Announcement deleted');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) { toast.error('Failed to delete announcement'); }
  };

  // Banner Handlers
  const handleCreateBanner = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/banners', { ...bannerForm, type: 'HERO_SLIDER' });
      toast.success('Hero Banner added!');
      setBannerModal(false);
      setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
      fetchAllData();
    } catch (err) { toast.error('Failed to create banner'); }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await api.delete(`/cms/banners/${id}`);
      toast.success('Banner deleted');
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) { toast.error('Failed to delete banner'); }
  };

  // Section Products Filtering
  const sectionProducts = products.filter(p => p.showOnHomepage && p[activeSection]);
  const otherProducts = products.filter(p => !p[activeSection] || !p.showOnHomepage);

  const sectionsList = [
    { key: 'featured', label: '⭐ Featured Products', desc: 'Main Home Page showcase section' },
    { key: 'trending', label: '🔥 Trending Now', desc: 'High demand & viral items' },
    { key: 'newArrival', label: '✨ New Arrivals', desc: 'Fresh arrivals collection' },
    { key: 'bestSeller', label: '🏆 Best Sellers', desc: 'Top performing sales items' },
    { key: 'isRecommended', label: '💎 Recommended Choice', desc: 'Curated store picks' },
    { key: 'isPremium', label: '👑 Premium Collection', desc: 'Luxury high-end fashion' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Page Manager</h1>
        <p className="text-sm text-gray-500">Control homepage section products, hero slider banners, and announcement bar in real time</p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm max-w-xl">
        {[
          { key: 'sections', label: '🏠 Section Products', icon: FiLayers },
          { key: 'banners', label: '🖼️ Hero Banners', icon: FiImage },
          { key: 'announcements', label: '📢 Announcements', icon: FiTag },
          { key: 'flash', label: '⚡ Flash Sale', icon: FiZap },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SECTION PRODUCTS MANAGER */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Sub-Section Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {sectionsList.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSection(sec.key)}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  activeSection === sec.key
                    ? 'border-amber-400 bg-amber-50/80 font-bold'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-xs text-gray-900 truncate">{sec.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {products.filter(p => p.showOnHomepage && p[sec.key]).length} active
                </p>
              </button>
            ))}
          </div>

          {/* Section Products Display Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {sectionsList.find(s => s.key === activeSection)?.label}
                </h2>
                <p className="text-xs text-gray-500">
                  {sectionsList.find(s => s.key === activeSection)?.desc}. Removing a product from Home Page ONLY removes it from the Home Page — it remains in Catalog and Search!
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                {sectionProducts.length} Products Assigned
              </span>
            </div>

            {sectionProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No products currently visible in this section. Add products below!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {sectionProducts.map((product) => {
                  const img = product.images?.[0]?.url || 'https://placehold.co/100x100?text=NO+IMAGE';
                  return (
                    <div key={product.id} className="border border-gray-200 rounded-2xl p-3 bg-white shadow-sm hover:shadow-md transition relative group">
                      <img src={img} alt="" className="w-full h-36 object-cover rounded-xl bg-gray-100 mb-3" />
                      <h4 className="font-bold text-xs text-gray-900 truncate">{product.name}</h4>
                      <p className="text-[11px] text-gray-500 font-semibold">{formatCurrency(product.discountPrice || product.price)}</p>

                      <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-2.5">
                        {/* Remove from Home Page Action */}
                        <button
                          type="button"
                          onClick={() => handleToggleHomepageDisplay(product)}
                          className="w-full py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FiTrash2 size={12} /> Remove from Home Page
                        </button>

                        {/* Toggle Section Badge Action */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(product, activeSection)}
                          className="w-full py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-[10px] font-semibold transition"
                        >
                          Unassign from Section
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Available Products to this Section */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider mb-3">
                ➕ Add Other Catalog Products to {sectionsList.find(s => s.key === activeSection)?.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {otherProducts.slice(0, 12).map((product) => {
                  const img = product.images?.[0]?.url || 'https://placehold.co/40x40?text=IMG';
                  return (
                    <div key={product.id} className="flex items-center justify-between p-2.5 border rounded-xl bg-gray-50/50 hover:bg-gray-100 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={img} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400">{formatCurrency(product.price)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!product.showOnHomepage) handleToggleHomepageDisplay(product);
                          handleToggleSection(product, activeSection);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[10px] font-bold shadow-sm hover:bg-amber-500 transition shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO BANNERS */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hero Slider Banners</h2>
              <p className="text-xs text-gray-500">Main homepage rotating luxury banners</p>
            </div>
            <Button icon={FiPlus} onClick={() => setBannerModal(true)}>Add Banner Slide</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="border rounded-xl overflow-hidden bg-gray-50 relative group">
                <img src={b.imageUrl} alt="" className="w-full h-36 object-cover" />
                <div className="p-3">
                  <h4 className="font-bold text-xs text-gray-900 truncate">{b.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{b.subtitle}</p>
                </div>
                <button onClick={() => handleDeleteBanner(b.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow cursor-pointer">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Header Announcement Bar</h2>
              <p className="text-xs text-gray-500">Top sticky notification bar across all pages</p>
            </div>
            <Button icon={FiPlus} onClick={() => setAnnModal(true)}>Add Announcement</Button>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
                className="p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div className="text-xs">
                  <span className="font-bold mr-2">[{a.title}]</span>
                  <span>{a.message}</span>
                </div>
                <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-2 hover:bg-black/10 rounded-lg transition cursor-pointer">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FLASH SALE */}
      {activeTab === 'flash' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FiZap className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Midnight Flash Sale Configurator</h2>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const endTime = new Date(Date.now() + parseFloat(flashForm.hoursLeft || 24) * 60 * 60 * 1000);
            await api.post('/cms/flash-sale', {
              title: flashForm.title,
              description: flashForm.description,
              discountPercent: parseFloat(flashForm.discountPercent),
              endTime,
              isActive: true,
            });
            toast.success('Flash Sale updated & live on Home Page!');
            fetchAllData();
          }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Sale Title" value={flashForm.title} onChange={e => setFlashForm({ ...flashForm, title: e.target.value })} required />
            <Input label="Discount %" type="number" value={flashForm.discountPercent} onChange={e => setFlashForm({ ...flashForm, discountPercent: e.target.value })} required />
            <Input label="Duration (Hours)" type="number" value={flashForm.hoursLeft} onChange={e => setFlashForm({ ...flashForm, hoursLeft: e.target.value })} required />
            <Input label="Subtitle Description" value={flashForm.description} onChange={e => setFlashForm({ ...flashForm, description: e.target.value })} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Publish Flash Sale</Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Announcement */}
      <Modal isOpen={annModal} onClose={() => setAnnModal(false)} title="Add Header Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input label="Tag Title" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required placeholder="e.g. FESTIVE OFFER" />
          <Input label="Message Text" value={annForm.message} onChange={e => setAnnForm({ ...annForm, message: e.target.value })} required placeholder="e.g. Get 20% OFF on all Sarees" />
          <Input label="Target Link" value={annForm.link} onChange={e => setAnnForm({ ...annForm, link: e.target.value })} placeholder="/categories/womens-sarees" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Background Color</label>
              <input type="color" value={annForm.backgroundColor} onChange={e => setAnnForm({ ...annForm, backgroundColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Text Color</label>
              <input type="color" value={annForm.textColor} onChange={e => setAnnForm({ ...annForm, textColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAnnModal(false)}>Cancel</Button>
            <Button type="submit">Publish Announcement</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Banner */}
      <Modal isOpen={bannerModal} onClose={() => setBannerModal(false)} title="Add Hero Slider Banner">
        <form onSubmit={handleCreateBanner} className="space-y-4">
          <Input label="Banner Heading" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required placeholder="e.g. Royal Wedding Collection" />
          <Input label="Subtitle" value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} placeholder="e.g. Handcrafted Sarees & Jewellery" />
          <Input label="Image URL" value={bannerForm.imageUrl} onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} required placeholder="https://images.unsplash.com/photo-..." />
          <Input label="Target Link" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} placeholder="/categories/womens-sarees" />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setBannerModal(false)}>Cancel</Button>
            <Button type="submit">Add Banner</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminHomepage;
