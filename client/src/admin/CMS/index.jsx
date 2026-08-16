import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setStoreSettings } from '../../redux/settings/settingsSlice';
import api from '../../config/api';
import Button from '../../components/common/Button';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import { 
  FiFileText, FiSettings, FiPhoneCall, FiMessageCircle, FiShare2, 
  FiLayout, FiInfo, FiSearch, FiMail, FiUsers, FiSave, FiEdit3, 
  FiUpload, FiEye, FiTrash2, FiCheck, FiX, FiCheckCircle, FiRefreshCw
} from 'react-icons/fi';

const TABS = [
  { id: 'pages', label: 'Dynamic Pages', icon: FiFileText },
  { id: 'settings', label: 'Website Settings', icon: FiSettings },
  { id: 'contact', label: 'Contact Information', icon: FiPhoneCall },
  { id: 'whatsapp', label: 'WhatsApp Ordering', icon: FiMessageCircle },
  { id: 'social', label: 'Social Media', icon: FiShare2 },
  { id: 'footer', label: 'Footer Settings', icon: FiLayout },
  { id: 'store', label: 'Store Information', icon: FiInfo },
  { id: 'seo', label: 'SEO Settings', icon: FiSearch },
  { id: 'inquiries', label: 'Customer Inquiries', icon: FiMail },
  { id: 'newsletter', label: 'Newsletter Subscribers', icon: FiUsers },
];

const DEFAULT_PAGES = [
  'about-us', 'contact-us', 'privacy-policy', 'terms-conditions', 
  'shipping-policy', 'refund-policy', 'cancellation-policy', 
  'return-policy', 'faq', 'careers', 'blog'
];

const AdminCMS = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    storeName: 'StyleVerse',
    storeTagline: 'Enterprise Luxury Clothing & Jewellery Platform',
    logoUrl: '',
    faviconUrl: '', 
    currencySymbol: '₹',
    primaryColor: '#D4AF37',
    secondaryColor: '#1A1A1A', 
    maintenanceMode: false,
    
    contactPhone: '+91 98765 43210',
    alternatePhone: '',
    contactEmail: 'support@styleverse.com',
    supportEmail: '', 
    address: '123 Fashion Street, Cyber City, Hyderabad, India',
    googleMapsLink: '',
    businessHours: 'Mon-Sat 9AM-7PM',
    
    whatsappNumber: '919876543210',
    whatsappCountryCode: '+91',
    whatsappEnabled: true,
    whatsappBusinessName: 'StyleVerse Concierge', 
    whatsappWorkingHours: 'Mon-Sat 9AM-7PM',
    whatsappAutoReply: 'Thank you for contacting StyleVerse. An executive will assist you shortly.',
    whatsappDefaultMessage: 'Hi! I would like to place an order from StyleVerse.',
    whatsappGreeting: 'Welcome to StyleVerse Luxury Shopping!',
    whatsappThankYou: 'Thank you for choosing StyleVerse.',
    
    instagramUrl: '',
    facebookUrl: '',
    youtubeUrl: '', 
    twitterUrl: '',
    telegramUrl: '',
    pinterestUrl: '',
    linkedinUrl: '',
    
    footerDescription: 'Discover handcrafted royal jewellery and luxury designer fashion crafted to royal perfection.',
    copyrightText: '© 2026 StyleVerse. All Rights Reserved.',
    footerQuickLinks: '[]', 
    showPaymentIcons: true,
    showTrustBadges: true,
    
    language: 'English',
    timeZone: 'Asia/Kolkata',
    currency: 'INR',
    
    metaTitle: 'StyleVerse | Luxury Designer Fashion & Royal Jewellery',
    metaDescription: 'Discover handcrafted royal jewellery and luxury designer fashion.',
    metaKeywords: 'luxury fashion, royal jewellery, bridal couture', 
    ogImageUrl: '',
    robotsTxt: 'User-agent: *\nAllow: /'
  });

  // Pages State
  const [pages, setPages] = useState({});
  const [selectedPage, setSelectedPage] = useState(null);
  
  // Data States
  const [inquiries, setInquiries] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  // Image Editor State
  const [imageEditor, setImageEditor] = useState({ open: false, field: '', src: null, title: '', aspect: 1 });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'inquiries') fetchInquiries();
    if (activeTab === 'newsletter') fetchSubscribers();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/settings');
      if (res.data?.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
        dispatch(setStoreSettings(res.data.data));
      }
    } catch (error) {
      console.warn('CMS settings load fallback:', error?.message);
      try {
        const altRes = await api.get('/settings');
        if (altRes.data?.data) {
          setSettings(prev => ({ ...prev, ...altRes.data.data }));
          dispatch(setStoreSettings(altRes.data.data));
        }
      } catch {
        // Fallback default
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        ...settings,
        metaTitle: settings.metaTitle || settings.seoTitle || settings.storeName,
        metaDescription: settings.metaDescription || settings.seoDescription,
        metaKeywords: settings.metaKeywords || settings.seoKeywords,
        whatsappDefaultMessage: settings.whatsappDefaultMessage || settings.defaultOrderMessage,
        whatsappWorkingHours: settings.whatsappWorkingHours || settings.supportTiming,
      };

      const res = await api.put('/cms/settings', payload);
      const updated = res.data?.data || payload;
      setSettings(prev => ({ ...prev, ...updated }));

      // 1. Update Redux store
      dispatch(setStoreSettings(updated));

      // 2. Dynamically update browser tab Title and Favicon
      if (updated.storeName) {
        document.title = `${updated.storeName} | Luxury Fashion & Royal Jewellery`;
      }
      if (updated.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = updated.faviconUrl;
      }

      // 3. Broadcast real-time events to all live components
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('kvlr:content-updated', { detail: { type: 'STORE_SETTINGS', payload: updated } }));
      window.dispatchEvent(new CustomEvent('auth_settings_updated'));

      toast.success('✨ Website settings successfully saved to database & synchronized across entire storefront!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const fetchPage = async (slug) => {
    try {
      setLoading(true);
      const res = await api.get(`/cms/pages/${slug}`);
      setPages(prev => ({ ...prev, [slug]: res.data?.data || { slug, title: slug.replace('-', ' '), content: '', seoTitle: '', metaDescription: '' } }));
      setSelectedPage(slug);
    } catch (error) {
      setPages(prev => ({ ...prev, [slug]: { slug, title: slug.replace('-', ' '), content: '', seoTitle: '', metaDescription: '' } }));
      setSelectedPage(slug);
    } finally {
      setLoading(false);
    }
  };

  const savePage = async () => {
    try {
      setSaving(true);
      const pageData = pages[selectedPage];
      await api.put(`/cms/pages/${selectedPage}`, pageData);
      toast.success(`Page "${pageData.title || selectedPage}" saved to database`);
      window.dispatchEvent(new CustomEvent('kvlr:content-updated'));
    } catch (error) {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (field, value) => {
    setPages(prev => ({
      ...prev,
      [selectedPage]: { ...prev[selectedPage], [field]: value }
    }));
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/contact/admin/messages');
      setInquiries(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const markMessageRead = async (id) => {
    try {
      await api.put(`/cms/contact/admin/messages/${id}/read`);
      fetchInquiries();
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Permanently delete this customer inquiry from the database?')) return;
    try {
      await api.delete(`/cms/contact/admin/messages/${id}`);
      toast.success('Inquiry deleted from database');
      setInquiries(prev => prev.filter(m => (m.id || m._id) !== id));
    } catch (err) {
      toast.error('Failed to delete inquiry');
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/newsletter/admin/subscribers');
      setSubscribers(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('Permanently remove this subscriber from the database?')) return;
    try {
      await api.delete(`/cms/newsletter/admin/subscribers/${id}`);
      toast.success('Subscriber deleted from database');
      setSubscribers(prev => prev.filter(s => (s.id || s._id) !== id));
    } catch (err) {
      toast.error('Failed to delete subscriber');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Email', 'Status', 'Date'],
      ...subscribers.map(s => [s.email, s.isActive !== false ? 'Active' : 'Inactive', new Date(s.createdAt).toLocaleDateString()])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleImageSelect = (e, field, title = 'Edit Image', aspect = 1) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageEditor({ open: true, field, src: reader.result, title, aspect });
    reader.readAsDataURL(file);
  };

  const handleImageEditorComplete = (url) => {
    handleSettingChange(imageEditor.field, url);
    setImageEditor({ open: false, field: '', src: null, title: '', aspect: 1 });
  };

  const inputClasses = "w-full bg-black/40 border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm";
  const labelClasses = "block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2";
  const sectionClasses = "bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-6";
  const headerClasses = "text-2xl font-bold text-white mb-6 flex items-center gap-3";

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-5rem)] bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 lg:w-72 bg-black/90 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <FiSettings /> Website & CMS
            </h2>
            <p className="text-xs text-gray-400 mt-1">Live Database Synchronization</p>
          </div>
        </div>
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto py-2 md:py-4 space-x-1 md:space-x-0 md:space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 md:px-6 py-2.5 md:py-3.5 text-left transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 md:border-b-0 md:border-r-4 border-[#D4AF37] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="text-base md:text-lg shrink-0" />
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* 1. DYNAMIC PAGES */}
          {activeTab === 'pages' && (
            <div>
              <h2 className={headerClasses}><FiFileText className="text-[#D4AF37]" /> Dynamic Pages Management</h2>
              
              {!selectedPage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DEFAULT_PAGES.map(slug => (
                    <div key={slug} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all cursor-pointer group" onClick={() => fetchPage(slug)}>
                      <h3 className="text-lg font-semibold text-white capitalize group-hover:text-[#D4AF37]">{slug.replace('-', ' ')}</h3>
                      <p className="text-sm text-gray-400 mt-2">Manage content & SEO metadata</p>
                      <div className="mt-4 flex justify-end">
                        <FiEdit3 className="text-gray-500 group-hover:text-[#D4AF37]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={sectionClasses}>
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                      <button onClick={() => setSelectedPage(null)} className="text-gray-400 hover:text-white mr-2"><FiX /></button>
                      Edit {selectedPage.replace('-', ' ')}
                    </h3>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setSelectedPage(null)}>Cancel</Button>
                      <Button onClick={savePage} disabled={saving}><FiSave className="mr-2" /> Save Page</Button>
                    </div>
                  </div>
                  
                  {loading && !pages[selectedPage] ? (
                    <div className="text-center py-10 text-gray-400">Loading page data...</div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className={labelClasses}>Page Title</label>
                        <input type="text" className={inputClasses} value={pages[selectedPage]?.title || ''} onChange={e => handlePageChange('title', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClasses}>Content (HTML / Rich Text)</label>
                        <textarea className={`${inputClasses} h-64 font-mono text-sm`} value={pages[selectedPage]?.content || ''} onChange={e => handlePageChange('content', e.target.value)} placeholder="<p>Enter page content here...</p>" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClasses}>SEO Title</label>
                          <input type="text" className={inputClasses} value={pages[selectedPage]?.seoTitle || ''} onChange={e => handlePageChange('seoTitle', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClasses}>Meta Description</label>
                          <textarea className={`${inputClasses} h-24`} value={pages[selectedPage]?.metaDescription || ''} onChange={e => handlePageChange('metaDescription', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiSettings className="text-[#D4AF37]" /> Website Settings</h2>
                  <p className="text-xs text-gray-400 mt-1">Configure core branding, store name, logos, and maintenance mode</p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <FiRefreshCw className="animate-spin mr-2" /> : <FiSave className="mr-2" />} 
                  Save Website Settings
                </Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Store Name</label>
                    <input type="text" className={inputClasses} value={settings.storeName || ''} onChange={e => handleSettingChange('storeName', e.target.value)} placeholder="StyleVerse" required />
                  </div>
                  <div>
                    <label className={labelClasses}>Tagline</label>
                    <input type="text" className={inputClasses} value={settings.storeTagline || ''} onChange={e => handleSettingChange('storeTagline', e.target.value)} placeholder="Enterprise Luxury Clothing & Jewellery" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Store Logo</label>
                    <div className="flex items-center gap-4">
                      {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain bg-white/10 rounded px-2" />}
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white text-sm font-medium">
                        <FiUpload /> Upload Logo
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageSelect(e, 'logoUrl', 'Edit Store Logo', null)} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Favicon</label>
                    <div className="flex items-center gap-4">
                      {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain bg-white/10 rounded" />}
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white text-sm font-medium">
                        <FiUpload /> Upload Favicon
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageSelect(e, 'faviconUrl', 'Edit Favicon', 1)} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Currency Symbol</label>
                    <input type="text" className={inputClasses} value={settings.currencySymbol || '₹'} onChange={e => handleSettingChange('currencySymbol', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Primary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={settings.primaryColor || '#D4AF37'} onChange={e => handleSettingChange('primaryColor', e.target.value)} className="h-11 w-11 rounded-lg cursor-pointer bg-transparent border border-white/20" />
                      <input type="text" className={inputClasses} value={settings.primaryColor || '#D4AF37'} onChange={e => handleSettingChange('primaryColor', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={settings.secondaryColor || '#1A1A1A'} onChange={e => handleSettingChange('secondaryColor', e.target.value)} className="h-11 w-11 rounded-lg cursor-pointer bg-transparent border border-white/20" />
                      <input type="text" className={inputClasses} value={settings.secondaryColor || '#1A1A1A'} onChange={e => handleSettingChange('secondaryColor', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <h4 className="text-white font-bold text-sm">Maintenance Mode</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Put the website offline for regular storefront visitors while allowing admin access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={Boolean(settings.maintenanceMode)} onChange={e => handleSettingChange('maintenanceMode', e.target.checked)} />
                    <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save Website Settings
                </Button>
              </div>
            </form>
          )}

          {/* 3. CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiPhoneCall className="text-[#D4AF37]" /> Contact Information</h2>
                  <p className="text-xs text-gray-400 mt-1">Updates the Contact page, footer helpline, and customer communication channels</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Contact Info</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Primary Phone Number</label>
                    <input type="text" className={inputClasses} value={settings.contactPhone || ''} onChange={e => handleSettingChange('contactPhone', e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className={labelClasses}>Alternate Phone Number</label>
                    <input type="text" className={inputClasses} value={settings.alternatePhone || ''} onChange={e => handleSettingChange('alternatePhone', e.target.value)} placeholder="+91 91234 56789" />
                  </div>
                  <div>
                    <label className={labelClasses}>Contact Email</label>
                    <input type="email" className={inputClasses} value={settings.contactEmail || ''} onChange={e => handleSettingChange('contactEmail', e.target.value)} placeholder="contact@styleverse.com" />
                  </div>
                  <div>
                    <label className={labelClasses}>Support Email</label>
                    <input type="email" className={inputClasses} value={settings.supportEmail || ''} onChange={e => handleSettingChange('supportEmail', e.target.value)} placeholder="support@styleverse.com" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className={labelClasses}>Store Physical Address</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.address || ''} onChange={e => handleSettingChange('address', e.target.value)} placeholder="123 Fashion Street, Cyber City, Hyderabad, India" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Google Maps Embed / Navigation Link</label>
                    <input type="text" className={inputClasses} value={settings.googleMapsLink || ''} onChange={e => handleSettingChange('googleMapsLink', e.target.value)} placeholder="https://maps.google.com/..." />
                  </div>
                  <div>
                    <label className={labelClasses}>Business Operating Hours</label>
                    <input type="text" className={inputClasses} value={settings.businessHours || ''} onChange={e => handleSettingChange('businessHours', e.target.value)} placeholder="Mon-Sat: 9:00 AM - 7:00 PM" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save Contact Info
                </Button>
              </div>
            </form>
          )}

          {/* 4. WHATSAPP ORDERING */}
          {activeTab === 'whatsapp' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiMessageCircle className="text-[#D4AF37]" /> WhatsApp Ordering & Chat</h2>
                  <p className="text-xs text-gray-400 mt-1">Configures WhatsApp Buy Now checkout, floating chat button, and automated order templates</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save WhatsApp Settings</Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className={sectionClasses}>
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                      <div>
                        <h4 className="text-base font-bold text-white">Enable WhatsApp Ordering & Floating Chat</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Allow customers to order and message directly via WhatsApp</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={Boolean(settings.whatsappEnabled)} onChange={e => handleSettingChange('whatsappEnabled', e.target.checked)} />
                        <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelClasses}>WhatsApp Business Number</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 bg-black/40 border border-r-0 border-[#D4AF37]/30 rounded-l-lg text-gray-400 font-mono text-sm">+</span>
                          <input type="text" className={`${inputClasses} rounded-l-none`} value={settings.whatsappNumber || ''} onChange={e => handleSettingChange('whatsappNumber', e.target.value)} placeholder="919876543210" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>WhatsApp Business Name</label>
                        <input type="text" className={inputClasses} value={settings.whatsappBusinessName || ''} onChange={e => handleSettingChange('whatsappBusinessName', e.target.value)} placeholder="StyleVerse Luxury" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className={labelClasses}>Default Order Message Template</label>
                      <textarea className={`${inputClasses} h-28 font-mono text-xs`} value={settings.whatsappDefaultMessage || settings.defaultOrderMessage || ''} onChange={e => {
                        handleSettingChange('whatsappDefaultMessage', e.target.value);
                        handleSettingChange('defaultOrderMessage', e.target.value);
                      }} placeholder="Hi, I would like to place an order for: {product_name}..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClasses}>Support / Working Hours</label>
                        <input type="text" className={inputClasses} value={settings.whatsappWorkingHours || settings.supportTiming || ''} onChange={e => {
                          handleSettingChange('whatsappWorkingHours', e.target.value);
                          handleSettingChange('supportTiming', e.target.value);
                        }} placeholder="Mon-Sat 9AM-7PM" />
                      </div>
                      <div>
                        <label className={labelClasses}>Auto Reply Message</label>
                        <input type="text" className={inputClasses} value={settings.whatsappAutoReply || ''} onChange={e => handleSettingChange('whatsappAutoReply', e.target.value)} placeholder="Thank you for contacting us! We reply within minutes." />
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Preview Mockup */}
                <div className="lg:col-span-1">
                  <div className="bg-[#E5DDD5] rounded-3xl p-4 h-[500px] border-[6px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="bg-[#075E54] text-white p-3 -mx-4 -mt-4 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#075E54] font-bold text-lg overflow-hidden shrink-0">
                        {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : (settings.whatsappBusinessName?.charAt(0) || 'S')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm truncate">{settings.whatsappBusinessName || settings.storeName || 'StyleVerse'}</h4>
                        <p className="text-[11px] opacity-80">🟢 Online ({settings.whatsappWorkingHours || '9AM-7PM'})</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none max-w-[88%] self-end ml-auto text-gray-800 text-xs shadow-sm">
                        {settings.whatsappDefaultMessage || 'Hi! I would like to place an order from StyleVerse.'}
                        <div className="text-[10px] text-gray-500 text-right mt-1">10:42 AM <FiCheckCircle className="inline text-blue-500 ml-1" /></div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-xl rounded-tl-none max-w-[88%] text-gray-800 text-xs shadow-sm">
                        {settings.whatsappAutoReply || 'Welcome to StyleVerse! How can our concierge assist you today?'}
                        <div className="text-[10px] text-gray-500 text-right mt-1">10:42 AM</div>
                      </div>
                    </div>

                    <div className="bg-[#F0F0F0] p-2 rounded-full -mx-2 -mb-2 mt-3 flex items-center gap-2">
                      <div className="bg-white flex-1 rounded-full px-4 py-1.5 text-xs text-gray-400 truncate">Type a message...</div>
                      <div className="bg-[#00897B] text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0"><FiMessageCircle /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save WhatsApp Settings
                </Button>
              </div>
            </form>
          )}

          {/* 5. SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiShare2 className="text-[#D4AF37]" /> Social Media Channels</h2>
                  <p className="text-xs text-gray-400 mt-1">Links are dynamically displayed in the header, footer, and social showcase banners</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Social Links</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Instagram Profile URL</label>
                    <input type="url" className={inputClasses} value={settings.instagramUrl || ''} onChange={e => handleSettingChange('instagramUrl', e.target.value)} placeholder="https://instagram.com/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>Facebook Page URL</label>
                    <input type="url" className={inputClasses} value={settings.facebookUrl || ''} onChange={e => handleSettingChange('facebookUrl', e.target.value)} placeholder="https://facebook.com/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>Twitter / X URL</label>
                    <input type="url" className={inputClasses} value={settings.twitterUrl || ''} onChange={e => handleSettingChange('twitterUrl', e.target.value)} placeholder="https://twitter.com/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>YouTube Channel URL</label>
                    <input type="url" className={inputClasses} value={settings.youtubeUrl || ''} onChange={e => handleSettingChange('youtubeUrl', e.target.value)} placeholder="https://youtube.com/@styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>LinkedIn Page URL</label>
                    <input type="url" className={inputClasses} value={settings.linkedinUrl || ''} onChange={e => handleSettingChange('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>Pinterest Profile URL</label>
                    <input type="url" className={inputClasses} value={settings.pinterestUrl || ''} onChange={e => handleSettingChange('pinterestUrl', e.target.value)} placeholder="https://pinterest.com/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>Telegram Channel URL</label>
                    <input type="url" className={inputClasses} value={settings.telegramUrl || ''} onChange={e => handleSettingChange('telegramUrl', e.target.value)} placeholder="https://t.me/styleverse" />
                  </div>
                  <div>
                    <label className={labelClasses}>WhatsApp Channel / Community URL</label>
                    <input type="url" className={inputClasses} value={settings.whatsappUrl || ''} onChange={e => handleSettingChange('whatsappUrl', e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save Social Links
                </Button>
              </div>
            </form>
          )}

          {/* 6. FOOTER SETTINGS */}
          {activeTab === 'footer' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiLayout className="text-[#D4AF37]" /> Footer Settings</h2>
                  <p className="text-xs text-gray-400 mt-1">Configures footer description, copyright text, trust badges, and payment gateway badges</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Footer Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="mb-6">
                  <label className={labelClasses}>Footer Brand Description</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.footerDescription || ''} onChange={e => handleSettingChange('footerDescription', e.target.value)} placeholder="Discover handcrafted royal jewellery and luxury designer fashion..." />
                </div>
                
                <div className="mb-6">
                  <label className={labelClasses}>Copyright Text</label>
                  <input type="text" className={inputClasses} value={settings.copyrightText || ''} onChange={e => handleSettingChange('copyrightText', e.target.value)} placeholder="© 2026 StyleVerse. All Rights Reserved." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <h4 className="text-white font-bold text-sm">Show Payment Icons</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Display Visa, Mastercard, UPI & Netbanking badges in footer</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={Boolean(settings.showPaymentIcons)} onChange={e => handleSettingChange('showPaymentIcons', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <h4 className="text-white font-bold text-sm">Show Trust Badges</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Display 100% Authentic, Secure SSL, and Easy Returns badges</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={Boolean(settings.showTrustBadges)} onChange={e => handleSettingChange('showTrustBadges', e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save Footer Settings
                </Button>
              </div>
            </form>
          )}

          {/* 7. STORE INFORMATION */}
          {activeTab === 'store' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiInfo className="text-[#D4AF37]" /> Store Regional Settings</h2>
                  <p className="text-xs text-gray-400 mt-1">Configure default currency, language, and server time zone</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Store Info</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClasses}>Default Currency Code</label>
                    <select className={inputClasses} value={settings.currency || 'INR'} onChange={e => {
                      const c = e.target.value;
                      handleSettingChange('currency', c);
                      if (c === 'INR') handleSettingChange('currencySymbol', '₹');
                      else if (c === 'USD') handleSettingChange('currencySymbol', '$');
                      else if (c === 'EUR') handleSettingChange('currencySymbol', '€');
                      else if (c === 'GBP') handleSettingChange('currencySymbol', '£');
                    }}>
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Store Default Language</label>
                    <select className={inputClasses} value={settings.language || 'English'} onChange={e => handleSettingChange('language', e.target.value)}>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Time Zone</label>
                    <select className={inputClasses} value={settings.timeZone || 'Asia/Kolkata'} onChange={e => handleSettingChange('timeZone', e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                      <option value="UTC">UTC (GMT +00:00)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (BST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save Store Info
                </Button>
              </div>
            </form>
          )}

          {/* 8. SEO SETTINGS */}
          {activeTab === 'seo' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiSearch className="text-[#D4AF37]" /> Global SEO & Meta Tags</h2>
                  <p className="text-xs text-gray-400 mt-1">Configures Google search results, OpenGraph social previews, and crawler directives</p>
                </div>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save SEO Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="mb-6">
                  <label className={labelClasses}>Global Search Title (Meta Title)</label>
                  <input type="text" className={inputClasses} value={settings.metaTitle || settings.seoTitle || ''} onChange={e => {
                    handleSettingChange('metaTitle', e.target.value);
                    handleSettingChange('seoTitle', e.target.value);
                  }} placeholder="StyleVerse | Premium Luxury Fashion & Royal Jewellery" />
                </div>
                
                <div className="mb-6">
                  <label className={labelClasses}>Global Meta Description</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.metaDescription || settings.seoDescription || ''} onChange={e => {
                    handleSettingChange('metaDescription', e.target.value);
                    handleSettingChange('seoDescription', e.target.value);
                  }} placeholder="Discover handcrafted royal jewellery and luxury designer fashion..." />
                </div>

                <div className="mb-6">
                  <label className={labelClasses}>Meta Keywords (comma separated)</label>
                  <input type="text" className={inputClasses} value={settings.metaKeywords || settings.seoKeywords || ''} onChange={e => {
                    handleSettingChange('metaKeywords', e.target.value);
                    handleSettingChange('seoKeywords', e.target.value);
                  }} placeholder="luxury fashion, royal jewellery, bridal lehengas, diamond couture" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Default OG Social Share Image</label>
                    <div className="flex flex-col gap-4">
                      {settings.ogImageUrl && <img src={settings.ogImageUrl} alt="OG" className="w-full max-h-40 object-cover rounded-lg border border-white/10" />}
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white text-sm font-medium">
                        <FiUpload /> Upload Social Preview Image
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageSelect(e, 'ogImageUrl', 'Edit Social Share Image', 16/9)} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Robots.txt Directives</label>
                    <textarea className={`${inputClasses} h-40 font-mono text-xs`} value={settings.robotsTxt || ''} onChange={e => handleSettingChange('robotsTxt', e.target.value)} placeholder="User-agent: *&#10;Allow: /" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <FiSave className="mr-2" /> Save SEO Settings
                </Button>
              </div>
            </form>
          )}

          {/* 9. CUSTOMER INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiMail className="text-[#D4AF37]" /> Customer Inquiries ({inquiries.length})</h2>
                  <p className="text-xs text-gray-400 mt-1">Real-time contact submissions received from the Contact Us page</p>
                </div>
                <Button variant="outline" onClick={fetchInquiries} disabled={loading}>
                  <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh Inquiries
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading customer inquiries...</div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/10">
                  <FiMail className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-semibold text-sm">No customer inquiries found in database.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map(msg => (
                    <div key={msg.id || msg._id} className={`p-5 rounded-xl border transition-all ${msg.isRead ? 'bg-white/5 border-white/10' : 'bg-[#D4AF37]/10 border-[#D4AF37]/40'}`}>
                      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            {msg.subject || 'Customer Inquiry'} {!msg.isRead && <span className="text-[10px] bg-[#D4AF37] text-black px-2 py-0.5 rounded-full font-black">NEW</span>}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            From: <strong className="text-gray-200">{msg.fullName || 'Anonymous'}</strong> ({msg.email}) {msg.phone && `• 📱 ${msg.phone}`}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="p-3.5 bg-black/50 rounded-lg text-gray-300 text-sm whitespace-pre-wrap border border-white/5">{msg.message}</div>
                      <div className="mt-4 flex justify-end gap-2">
                        {!msg.isRead && (
                          <Button variant="outline" size="sm" onClick={() => markMessageRead(msg.id || msg._id)}><FiCheck className="mr-1" /> Mark as Read</Button>
                        )}
                        <button
                          onClick={() => handleDeleteInquiry(msg.id || msg._id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. NEWSLETTER SUBSCRIBERS */}
          {activeTab === 'newsletter' && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className={headerClasses} style={{marginBottom: 0}}><FiUsers className="text-[#D4AF37]" /> Newsletter Subscribers ({subscribers.length})</h2>
                  <p className="text-xs text-gray-400 mt-1">Subscribed email addresses verified from the homepage and footer</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchSubscribers} disabled={loading}>
                    <FiRefreshCw className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                  {subscribers.length > 0 && (
                    <Button onClick={exportCSV}><FiUpload className="mr-2" /> Export CSV</Button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading subscribers...</div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/40 text-xs text-gray-400 uppercase tracking-wider font-bold">
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Subscribed Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {subscribers.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-500">No newsletter subscribers yet.</td></tr>
                      ) : (
                        subscribers.map(sub => (
                          <tr key={sub.id || sub._id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white font-medium">{sub.email}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${sub.isActive !== false ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {sub.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 text-xs">{new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDeleteSubscriber(sub.id || sub._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors p-2 rounded-lg" title="Delete subscriber">
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <GlobalImageEditor
        isOpen={imageEditor.open}
        imageSrc={imageEditor.src}
        onClose={() => setImageEditor({ open: false, field: '', src: null, title: '', aspect: 1 })}
        onComplete={handleImageEditorComplete}
        aspectRatio={imageEditor.aspect}
        title={imageEditor.title}
        showFileSelect={false}
      />
    </div>
  );
};

export default AdminCMS;
