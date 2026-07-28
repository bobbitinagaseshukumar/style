import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../config/api';
import Button from '../../components/common/Button';
import { 
  FiFileText, FiSettings, FiPhoneCall, FiMessageCircle, FiShare2, 
  FiLayout, FiInfo, FiSearch, FiMail, FiUsers, FiSave, FiEdit3, 
  FiUpload, FiEye, FiTrash2, FiCheck, FiX, FiCheckCircle
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
  const [activeTab, setActiveTab] = useState('pages');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    storeName: '', storeTagline: '', logoUrl: '', faviconUrl: '', 
    currencySymbol: '₹', primaryColor: '#D4AF37', secondaryColor: '#1A1A1A', 
    maintenanceMode: false,
    
    contactPhone: '', alternatePhone: '', contactEmail: '', supportEmail: '', 
    address: '', googleMapsLink: '', businessHours: '',
    
    whatsappNumber: '', whatsappCountryCode: '+91', whatsappEnabled: false, whatsappBusinessName: '', 
    whatsappWorkingHours: '', whatsappAutoReply: '', whatsappDefaultMessage: '',
    whatsappGreeting: '', whatsappThankYou: '',
    
    instagramUrl: '', facebookUrl: '', youtubeUrl: '', 
    twitterUrl: '', telegramUrl: '', pinterestUrl: '', linkedinUrl: '',
    
    footerDescription: '', copyrightText: '', footerQuickLinks: '[]', 
    showPaymentIcons: true, showTrustBadges: true,
    
    language: 'English', timeZone: 'Asia/Kolkata',
    
    metaTitle: '', metaDescription: '', metaKeywords: '', 
    ogImageUrl: '', robotsTxt: 'User-agent: *\nAllow: /'
  });

  // Pages State
  const [pages, setPages] = useState({});
  const [selectedPage, setSelectedPage] = useState(null);
  
  // Data States
  const [inquiries, setInquiries] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

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
      if (res.data?.data) setSettings(prev => ({ ...prev, ...res.data.data }));
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await api.put('/cms/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
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
      toast.success('Page saved successfully');
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

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      toast.info('Uploading image...');
      const res = await api.post('/upload/image', formData);
      handleSettingChange(field, res.data.url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Upload failed');
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

  const exportCSV = () => {
    const csv = [
      ['Email', 'Status', 'Date'],
      ...subscribers.map(s => [s.email, s.isActive ? 'Active' : 'Inactive', new Date(s.createdAt).toLocaleDateString()])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  const inputClasses = "w-full bg-black/40 border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-2";
  const sectionClasses = "bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-6";
  const headerClasses = "text-2xl font-bold text-white mb-6 flex items-center gap-3";

  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-5rem)] bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Sidebar Navigation (Desktop Left Sidebar / Mobile Top Horizontal Bar) */}
      <div className="w-full md:w-64 lg:w-72 bg-black/90 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-[#D4AF37] flex items-center gap-2">
            <FiSettings /> Settings & CMS
          </h2>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
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
                      <p className="text-sm text-gray-400 mt-2">Manage content & SEO</p>
                      <div className="mt-4 flex justify-end">
                        <FiEdit3 className="text-gray-500 group-hover:text-[#D4AF37]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={sectionClasses}>
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
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
                        <label className={labelClasses}>Content (HTML/Rich Text)</label>
                        <textarea className={`${inputClasses} h-64 font-mono text-sm`} value={pages[selectedPage]?.content || ''} onChange={e => handlePageChange('content', e.target.value)} placeholder="<p>Enter page content here...</p>" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
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
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiSettings className="text-[#D4AF37]" /> Website Settings</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Store Name</label>
                    <input type="text" className={inputClasses} value={settings.storeName || ''} onChange={e => handleSettingChange('storeName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Tagline</label>
                    <input type="text" className={inputClasses} value={settings.storeTagline || ''} onChange={e => handleSettingChange('storeTagline', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Store Logo</label>
                    <div className="flex items-center gap-4">
                      {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 bg-white/10 rounded px-2" />}
                      <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white">
                        <FiUpload /> Upload Logo
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logoUrl')} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Favicon</label>
                    <div className="flex items-center gap-4">
                      {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon" className="h-8 w-8 bg-white/10 rounded" />}
                      <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white">
                        <FiUpload /> Upload Favicon
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'faviconUrl')} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Currency Symbol</label>
                    <input type="text" className={inputClasses} value={settings.currencySymbol || ''} onChange={e => handleSettingChange('currencySymbol', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={settings.primaryColor || '#D4AF37'} onChange={e => handleSettingChange('primaryColor', e.target.value)} className="h-10 w-10 rounded cursor-pointer bg-transparent border-0" />
                      <input type="text" className={inputClasses} value={settings.primaryColor || ''} onChange={e => handleSettingChange('primaryColor', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={settings.secondaryColor || '#000000'} onChange={e => handleSettingChange('secondaryColor', e.target.value)} className="h-10 w-10 rounded cursor-pointer bg-transparent border-0" />
                      <input type="text" className={inputClasses} value={settings.secondaryColor || ''} onChange={e => handleSettingChange('secondaryColor', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <h4 className="text-white font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-gray-400">Put the website offline for visitors</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={e => handleSettingChange('maintenanceMode', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>
              </div>
            </form>
          )}

          {/* 3. CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiPhoneCall className="text-[#D4AF37]" /> Contact Information</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClasses}>Primary Phone Number</label>
                    <input type="text" className={inputClasses} value={settings.contactPhone || ''} onChange={e => handleSettingChange('contactPhone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Alternate Phone Number</label>
                    <input type="text" className={inputClasses} value={settings.alternatePhone || ''} onChange={e => handleSettingChange('alternatePhone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Contact Email</label>
                    <input type="email" className={inputClasses} value={settings.contactEmail || ''} onChange={e => handleSettingChange('contactEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClasses}>Support Email</label>
                    <input type="email" className={inputClasses} value={settings.supportEmail || ''} onChange={e => handleSettingChange('supportEmail', e.target.value)} />
                  </div>
                </div>

                <div className="mb-6">
                  <label className={labelClasses}>Store Address</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.address || ''} onChange={e => handleSettingChange('address', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Google Maps Embed Link</label>
                    <input type="text" className={inputClasses} value={settings.googleMapsLink || ''} onChange={e => handleSettingChange('googleMapsLink', e.target.value)} placeholder="https://maps.google.com/..." />
                  </div>
                  <div>
                    <label className={labelClasses}>Business Hours</label>
                    <input type="text" className={inputClasses} value={settings.businessHours || ''} onChange={e => handleSettingChange('businessHours', e.target.value)} placeholder="e.g. Mon-Fri: 9AM - 6PM" />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 4. WHATSAPP ORDERING */}
          {activeTab === 'whatsapp' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiMessageCircle className="text-[#D4AF37]" /> WhatsApp Settings</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className={sectionClasses}>
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                      <div>
                        <h4 className="text-lg font-bold text-white">Enable WhatsApp Ordering</h4>
                        <p className="text-sm text-gray-400">Allow customers to send orders directly to WhatsApp</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappEnabled || false} onChange={e => handleSettingChange('whatsappEnabled', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelClasses}>WhatsApp Business Number</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 bg-black/40 border border-r-0 border-[#D4AF37]/30 rounded-l-lg text-gray-400">+</span>
                          <input type="text" className={`${inputClasses} rounded-l-none`} value={settings.whatsappNumber || ''} onChange={e => handleSettingChange('whatsappNumber', e.target.value)} placeholder="919876543210" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>WhatsApp Business Name</label>
                        <input type="text" className={inputClasses} value={settings.whatsappBusinessName || ''} onChange={e => handleSettingChange('whatsappBusinessName', e.target.value)} />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className={labelClasses}>Default Order Message Template</label>
                      <textarea className={`${inputClasses} h-32`} value={settings.defaultOrderMessage || ''} onChange={e => handleSettingChange('defaultOrderMessage', e.target.value)} placeholder="Hi, I would like to order: {product_name} - {quantity}..." />
                      <p className="text-xs text-gray-400 mt-2">Available variables: {'{product_name}'}, {'{quantity}'}, {'{price}'}, {'{total}'}, {'{url}'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClasses}>Support Timing</label>
                        <input type="text" className={inputClasses} value={settings.supportTiming || ''} onChange={e => handleSettingChange('supportTiming', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClasses}>Auto Reply Message</label>
                        <input type="text" className={inputClasses} value={settings.whatsappAutoReply || ''} onChange={e => handleSettingChange('whatsappAutoReply', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Preview */}
                <div className="lg:col-span-1">
                  <div className="bg-[#E5DDD5] rounded-3xl p-4 h-[600px] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="bg-[#075E54] text-white p-3 -mx-4 -mt-4 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#075E54] font-bold text-xl overflow-hidden">
                        {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" /> : settings.whatsappBusinessName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-semibold">{settings.whatsappBusinessName || 'Store Name'}</h4>
                        <p className="text-xs opacity-80">Online</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4">
                      <div className="bg-[#DCF8C6] p-3 rounded-lg rounded-tr-none max-w-[80%] self-end ml-auto text-gray-800 text-sm shadow-sm relative">
                        {settings.defaultOrderMessage?.replace('{product_name}', 'Premium Gold Watch').replace('{price}', '₹5,000') || 'Hi, I would like to order...'}
                        <div className="text-[10px] text-gray-500 text-right mt-1">10:42 AM <FiCheckCircle className="inline text-blue-500" /></div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[80%] text-gray-800 text-sm shadow-sm relative">
                        {settings.whatsappAutoReply || 'Thank you for your message. We will get back to you shortly.'}
                        <div className="text-[10px] text-gray-500 text-right mt-1">10:42 AM</div>
                      </div>
                    </div>

                    <div className="bg-[#F0F0F0] p-2 rounded-full -mx-2 -mb-2 mt-4 flex items-center gap-2">
                      <div className="bg-white flex-1 rounded-full px-4 py-2 text-sm text-gray-400">Type a message</div>
                      <div className="bg-[#00897B] text-white w-10 h-10 rounded-full flex items-center justify-center"><FiMessageCircle /></div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 5. SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiShare2 className="text-[#D4AF37]" /> Social Media Links</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['instagram', 'facebook', 'twitter', 'youtube', 'linkedin', 'pinterest', 'telegram', 'whatsapp'].map(platform => (
                    <div key={platform}>
                      <label className={`${labelClasses} capitalize`}>{platform} URL</label>
                      <input type="url" className={inputClasses} value={settings[`${platform}Url`] || ''} onChange={e => handleSettingChange(`${platform}Url`, e.target.value)} placeholder={`https://${platform}.com/...`} />
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* 6. FOOTER SETTINGS */}
          {activeTab === 'footer' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiLayout className="text-[#D4AF37]" /> Footer Settings</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="mb-6">
                  <label className={labelClasses}>Footer Description</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.footerDescription || ''} onChange={e => handleSettingChange('footerDescription', e.target.value)} />
                </div>
                
                <div className="mb-6">
                  <label className={labelClasses}>Copyright Text</label>
                  <input type="text" className={inputClasses} value={settings.copyrightText || ''} onChange={e => handleSettingChange('copyrightText', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-white font-medium mb-4">Payment Icons to Display</h4>
                    <div className="space-y-3">
                      {['visa', 'mastercard', 'paypal', 'upi', 'amex'].map(method => (
                        <label key={method} className="flex items-center gap-3 text-gray-300 capitalize cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#D4AF37] focus:ring-[#D4AF37]" checked={settings.paymentIcons?.[method] || false} onChange={e => handleSettingChange('paymentIcons', { ...settings.paymentIcons, [method]: e.target.checked })} />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-4">Trust Badges</h4>
                    <div className="space-y-3">
                      {['secure', 'authentic', 'quality', 'return'].map(badge => (
                        <label key={badge} className="flex items-center gap-3 text-gray-300 capitalize cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#D4AF37] focus:ring-[#D4AF37]" checked={settings.trustBadges?.[badge] || false} onChange={e => handleSettingChange('trustBadges', { ...settings.trustBadges, [badge]: e.target.checked })} />
                          {badge} Guarantee
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 7. STORE INFORMATION */}
          {activeTab === 'store' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiInfo className="text-[#D4AF37]" /> Store Information</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Default Currency</label>
                    <select className={inputClasses} value={settings.currency || 'INR'} onChange={e => handleSettingChange('currency', e.target.value)}>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Store Language</label>
                    <select className={inputClasses} value={settings.language || 'en'} onChange={e => handleSettingChange('language', e.target.value)}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Time Zone</label>
                    <select className={inputClasses} value={settings.timeZone || 'Asia/Kolkata'} onChange={e => handleSettingChange('timeZone', e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 8. SEO SETTINGS */}
          {activeTab === 'seo' && (
            <form onSubmit={saveSettings}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiSearch className="text-[#D4AF37]" /> Global SEO Settings</h2>
                <Button type="submit" disabled={saving}><FiSave className="mr-2" /> Save Settings</Button>
              </div>
              
              <div className={sectionClasses}>
                <div className="mb-6">
                  <label className={labelClasses}>Global Website Title</label>
                  <input type="text" className={inputClasses} value={settings.seoTitle || ''} onChange={e => handleSettingChange('seoTitle', e.target.value)} />
                </div>
                
                <div className="mb-6">
                  <label className={labelClasses}>Global Meta Description</label>
                  <textarea className={`${inputClasses} h-24`} value={settings.seoDescription || ''} onChange={e => handleSettingChange('seoDescription', e.target.value)} />
                </div>

                <div className="mb-6">
                  <label className={labelClasses}>Meta Keywords (comma separated)</label>
                  <input type="text" className={inputClasses} value={settings.seoKeywords || ''} onChange={e => handleSettingChange('seoKeywords', e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Default OG Image (Social Share)</label>
                    <div className="flex flex-col gap-4">
                      {settings.ogImageUrl && <img src={settings.ogImageUrl} alt="OG" className="w-full max-h-40 object-cover rounded-lg border border-white/10" />}
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-white">
                        <FiUpload /> Upload Image
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'ogImageUrl')} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Robots.txt Content</label>
                    <textarea className={`${inputClasses} h-40 font-mono text-sm`} value={settings.robotsTxt || ''} onChange={e => handleSettingChange('robotsTxt', e.target.value)} placeholder="User-agent: *&#10;Disallow: /admin" />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 9. CUSTOMER INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div>
              <h2 className={headerClasses}><FiMail className="text-[#D4AF37]" /> Customer Inquiries</h2>
              
              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading inquiries...</div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl border border-white/10">No inquiries found.</div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map(msg => (
                    <div key={msg.id || msg._id} className={`p-5 rounded-xl border transition-all ${msg.isRead ? 'bg-white/5 border-white/10' : 'bg-[#D4AF37]/5 border-[#D4AF37]/30'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            {msg.subject} {!msg.isRead && <span className="text-xs bg-[#D4AF37] text-black px-2 py-1 rounded-full font-bold">NEW</span>}
                          </h4>
                          <p className="text-sm text-gray-400">{msg.fullName} ({msg.email}) {msg.phone && `• ${msg.phone}`}</p>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="p-3 bg-black/40 rounded-lg text-gray-300 text-sm whitespace-pre-wrap">{msg.message}</div>
                      {!msg.isRead && (
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => markMessageRead(msg.id || msg._id)}><FiCheck className="mr-1" /> Mark as Read</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. NEWSLETTER SUBSCRIBERS */}
          {activeTab === 'newsletter' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className={headerClasses} style={{marginBottom: 0}}><FiUsers className="text-[#D4AF37]" /> Newsletter Subscribers</h2>
                <Button onClick={exportCSV}><FiUpload className="mr-2" /> Export CSV</Button>
              </div>
              
              {loading ? (
                <div className="text-center py-10 text-gray-400">Loading subscribers...</div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/20">
                        <th className="p-4 text-gray-400 font-medium text-sm">Email Address</th>
                        <th className="p-4 text-gray-400 font-medium text-sm">Status</th>
                        <th className="p-4 text-gray-400 font-medium text-sm">Subscribed Date</th>
                        <th className="p-4 text-gray-400 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.length === 0 ? (
                        <tr><td colSpan="4" className="p-6 text-center text-gray-500">No subscribers yet.</td></tr>
                      ) : (
                        subscribers.map(sub => (
                          <tr key={sub.id || sub._id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 text-white font-medium">{sub.email}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${sub.isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {sub.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 text-sm">{new Date(sub.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <button className="text-red-400 hover:text-red-300 transition-colors p-2"><FiTrash2 /></button>
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
    </div>
  );
};

export default AdminCMS;
