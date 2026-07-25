import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../config/api';
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiCheck, FiTag, FiZap, FiImage, FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminHomepage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [banners, setBanners] = useState([]);
  const [flashSale, setFlashSale] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [annModal, setAnnModal] = useState(false);
  const [bannerModal, setBannerModal] = useState(false);

  // Form states
  const [annForm, setAnnForm] = useState({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
  const [flashForm, setFlashForm] = useState({ title: '', description: '', discountPercent: '30', hoursLeft: '24' });

  const fetchAllCMS = async () => {
    try {
      setLoading(true);
      const [annRes, banRes, flashRes, faqRes] = await Promise.all([
        api.get('/cms/announcements'),
        api.get('/cms/banners'),
        api.get('/cms/flash-sale'),
        api.get('/cms/faqs'),
      ]);

      setAnnouncements(annRes.data?.data || []);
      setBanners(banRes.data?.data || []);
      setFlashSale(flashRes.data?.data || null);
      setFaqs(faqRes.data?.data || []);

      if (flashRes.data?.data) {
        setFlashForm({
          title: flashRes.data.data.title || '',
          description: flashRes.data.data.description || '',
          discountPercent: flashRes.data.data.discountPercent || '30',
          hoursLeft: '24',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load CMS settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCMS();
  }, []);

  // Handlers
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/announcements', annForm);
      toast.success('Announcement added & published to Home Page!');
      setAnnModal(false);
      setAnnForm({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });
      fetchAllCMS();
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/cms/announcements/${id}`);
      toast.success('Announcement deleted');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/banners', { ...bannerForm, type: 'HERO_SLIDER' });
      toast.success('Banner added to Hero Slider!');
      setBannerModal(false);
      setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
      fetchAllCMS();
    } catch (err) {
      toast.error('Failed to create banner');
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await api.delete(`/cms/banners/${id}`);
      toast.success('Banner deleted');
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  const handleSaveFlashSale = async (e) => {
    e.preventDefault();
    try {
      const endTime = new Date(Date.now() + parseFloat(flashForm.hoursLeft || 24) * 60 * 60 * 1000);
      await api.post('/cms/flash-sale', {
        title: flashForm.title,
        description: flashForm.description,
        discountPercent: parseFloat(flashForm.discountPercent),
        endTime,
        isActive: true,
      });
      toast.success('Flash Sale updated & live on Home Page!');
      fetchAllCMS();
    } catch (err) {
      toast.error('Failed to update flash sale');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Homepage CMS...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage Control Center</h1>
        <p className="text-sm text-gray-500">Control announcements, hero banners, flash sales, and sections dynamically</p>
      </div>

      {/* 1. ANNOUNCEMENTS MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FiTag className="w-5 h-5 text-gold-600" />
            <h2 className="text-lg font-bold text-charcoal-900">Header Announcement Bar</h2>
          </div>
          <Button icon={FiPlus} onClick={() => setAnnModal(true)}>Add Announcement</Button>
        </div>

        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
              className="p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold mr-2">[{a.title}]</span>
                <span>{a.message}</span>
              </div>
              <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-2 hover:bg-black/10 rounded-lg transition">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-gray-400">No active announcements</p>}
        </div>
      </div>

      {/* 2. HERO BANNERS MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FiImage className="w-5 h-5 text-gold-600" />
            <h2 className="text-lg font-bold text-charcoal-900">Hero Slider Banners</h2>
          </div>
          <Button icon={FiPlus} onClick={() => setBannerModal(true)}>Add Banner Slide</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="border rounded-xl overflow-hidden bg-gray-50 relative group">
              <img src={b.imageUrl} alt="" className="w-full h-32 object-cover" />
              <div className="p-3">
                <h4 className="font-bold text-sm text-charcoal-900 truncate">{b.title}</h4>
                <p className="text-xs text-gray-500 truncate">{b.subtitle}</p>
              </div>
              <button onClick={() => handleDeleteBanner(b.id)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FLASH SALE MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FiZap className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-charcoal-900">Midnight Flash Sale Configurator</h2>
        </div>

        <form onSubmit={handleSaveFlashSale} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Sale Title" value={flashForm.title} onChange={e => setFlashForm({ ...flashForm, title: e.target.value })} required />
          <Input label="Discount %" type="number" value={flashForm.discountPercent} onChange={e => setFlashForm({ ...flashForm, discountPercent: e.target.value })} required />
          <Input label="Duration (Hours)" type="number" value={flashForm.hoursLeft} onChange={e => setFlashForm({ ...flashForm, hoursLeft: e.target.value })} required />
          <Input label="Subtitle Description" value={flashForm.description} onChange={e => setFlashForm({ ...flashForm, description: e.target.value })} />

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Publish Flash Sale</Button>
          </div>
        </form>
      </div>

      {/* Modal: Add Announcement */}
      <Modal isOpen={annModal} onClose={() => setAnnModal(false)} title="Add Header Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input label="Tag Title" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required placeholder="e.g. FESTIVE OFFER" />
          <Input label="Message Text" value={annForm.message} onChange={e => setAnnForm({ ...annForm, message: e.target.value })} required placeholder="e.g. Get 20% OFF on all Sarees" />
          <Input label="Target Link" value={annForm.link} onChange={e => setAnnForm({ ...annForm, link: e.target.value })} placeholder="/categories/womens-sarees" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input type="color" value={annForm.backgroundColor} onChange={e => setAnnForm({ ...annForm, backgroundColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
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
