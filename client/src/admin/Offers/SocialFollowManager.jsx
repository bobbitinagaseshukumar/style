import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import {
  FiPlus, FiTrash2, FiEdit, FiX, FiCopy, FiCheck,
  FiUploadCloud, FiToggleLeft, FiToggleRight, FiShare2,
  FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin, FiAtSign
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaPinterest, FaSnapchat } from 'react-icons/fa';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const PLATFORMS = [
  { id: 'INSTAGRAM', name: 'Instagram', icon: FiInstagram, color: '#E1306C', defaultUrl: 'https://instagram.com/styleverse' },
  { id: 'FACEBOOK', name: 'Facebook', icon: FiFacebook, color: '#1877F2', defaultUrl: 'https://facebook.com/styleverse' },
  { id: 'WHATSAPP', name: 'WhatsApp Chat', icon: FaWhatsapp, color: '#25D366', defaultUrl: 'https://wa.me/919876543210' },
  { id: 'WHATSAPP_CHANNEL', name: 'WhatsApp Channel', icon: FaWhatsapp, color: '#128C7E', defaultUrl: 'https://whatsapp.com/channel/styleverse' },
  { id: 'TELEGRAM', name: 'Telegram', icon: FaTelegram, color: '#0088cc', defaultUrl: 'https://t.me/styleverse' },
  { id: 'YOUTUBE', name: 'YouTube', icon: FiYoutube, color: '#FF0000', defaultUrl: 'https://youtube.com/@styleverse' },
  { id: 'X', name: 'X (Twitter)', icon: FiTwitter, color: '#000000', defaultUrl: 'https://x.com/styleverse' },
  { id: 'PINTEREST', name: 'Pinterest', icon: FaPinterest, color: '#BD081C', defaultUrl: 'https://pinterest.com/styleverse' },
  { id: 'THREADS', name: 'Threads', icon: FiAtSign, color: '#000000', defaultUrl: 'https://threads.net/@styleverse' },
  { id: 'SNAPCHAT', name: 'Snapchat', icon: FaSnapchat, color: '#FFFC00', defaultUrl: 'https://snapchat.com/add/styleverse' },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: FiLinkedin, color: '#0A66C2', defaultUrl: 'https://linkedin.com/company/styleverse' },
  { id: 'CUSTOM', name: 'Custom Platform', icon: FiShare2, color: '#D4AF37', defaultUrl: 'https://styleverse.com' },
];

const SocialFollowManager = () => {
  const [buttons, setButtons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBtn, setEditingBtn] = useState(null);

  // Form State
  const [form, setForm] = useState({
    platform: 'INSTAGRAM',
    accountName: 'StyleVerse Official',
    username: 'styleverse',
    profileUrl: 'https://instagram.com/styleverse',
    buttonText: 'Follow on Instagram',
    customIconUrl: '',
    bgColor: '#E1306C',
    textColor: '#FFFFFF',
    hoverColor: '#D4AF37',
    status: 'PUBLISHED',
    isActive: true,
    sortOrder: 0
  });

  // Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [btnRes, setRes] = await Promise.allSettled([
        api.get('/cms/social-follow/admin/all'),
        api.get('/cms/settings'),
      ]);

      if (btnRes.status === 'fulfilled') setButtons(btnRes.value.data?.data || []);
      if (setRes.status === 'fulfilled') {
        const cfg = setRes.value.data?.data || {};
        setMasterEnabled(cfg.enableSocialFollow !== false);
      }
    } catch { toast.error('Failed to load social buttons'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── TOGGLE MASTER SWITCH ──────────────────────────────── */
  const handleToggleMaster = async () => {
    const nextVal = !masterEnabled;
    try {
      await api.put('/cms/settings', { enableSocialFollow: nextVal });
      setMasterEnabled(nextVal);
      toast.success(nextVal ? 'Social Media Follow section ENABLED' : 'Social Media Follow section DISABLED');
    } catch { toast.error('Failed to update setting'); }
  };

  const openCreate = () => {
    setEditingBtn(null);
    setForm({
      platform: 'INSTAGRAM',
      accountName: 'StyleVerse Official',
      username: 'styleverse',
      profileUrl: 'https://instagram.com/styleverse',
      buttonText: 'Follow on Instagram',
      customIconUrl: '',
      bgColor: '#E1306C',
      textColor: '#FFFFFF',
      hoverColor: '#D4AF37',
      status: 'PUBLISHED',
      isActive: true,
      sortOrder: 0
    });
    setModalOpen(true);
  };

  const openEdit = (btn) => {
    setEditingBtn(btn);
    setForm({
      platform: btn.platform || 'INSTAGRAM',
      accountName: btn.accountName || '',
      username: btn.username || '',
      profileUrl: btn.profileUrl || '',
      buttonText: btn.buttonText || '',
      customIconUrl: btn.customIconUrl || '',
      bgColor: btn.bgColor || '#111827',
      textColor: btn.textColor || '#FFFFFF',
      hoverColor: btn.hoverColor || '#D4AF37',
      status: btn.status || 'PUBLISHED',
      isActive: btn.isActive !== false,
      sortOrder: btn.sortOrder || 0
    });
    setModalOpen(true);
  };

  const handlePlatformChange = (pId) => {
    const p = PLATFORMS.find(item => item.id === pId);
    setForm(prev => ({
      ...prev,
      platform: pId,
      profileUrl: p?.defaultUrl || prev.profileUrl,
      buttonText: `Follow on ${p?.name || pId}`,
      bgColor: p?.color || prev.bgColor
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.profileUrl.trim()) { toast.error('Profile URL is required'); return; }

    try {
      if (editingBtn) {
        await api.put(`/cms/social-follow/${editingBtn.id}`, form);
        toast.success('Social button updated!');
      } else {
        await api.post('/cms/social-follow', form);
        toast.success('Social button added!');
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error('Failed to save social button'); }
  };

  const handleTogglePublish = async (btn) => {
    const newStatus = btn.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/social-follow/${btn.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(newStatus === 'PUBLISHED' ? 'Button published' : 'Button hidden');
      fetchData();
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/social-follow/${deleteTarget.id}`);
      toast.success('Social button deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Social Media Follow Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-black border border-pink-200">📱 SOCIAL ENGAGEMENT</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Manage social media follow buttons & direct account redirects across all platforms</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleToggleMaster} className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border transition cursor-pointer ${masterEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {masterEnabled ? <FiToggleRight size={20} className="text-emerald-600" /> : <FiToggleLeft size={20} className="text-gray-400" />}
            {masterEnabled ? 'Social Section ENABLED' : 'Social Section DISABLED'}
          </button>
          <Button icon={FiPlus} onClick={openCreate}>+ Add Social Platform</Button>
        </div>
      </div>

      {!masterEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <FiShare2 size={16} />
          Social Media Follow section is currently <strong>DISABLED</strong>. Social buttons will not appear on the customer homepage.
        </div>
      )}

      {/* Buttons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : buttons.length === 0 ? (
        <div className="bg-white border rounded-3xl p-16 text-center shadow-sm">
          <FiShare2 size={40} className="text-pink-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Social Follow Buttons Added</h3>
          <p className="text-xs text-gray-400 mb-5">Add Instagram, WhatsApp, Telegram, YouTube, and Facebook follow buttons to connect with your customers.</p>
          <Button icon={FiPlus} onClick={openCreate}>Add First Social Platform</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buttons.map(btn => {
            const platformInfo = PLATFORMS.find(p => p.id === btn.platform) || PLATFORMS[PLATFORMS.length - 1];
            const IconComp = platformInfo.icon;

            return (
              <motion.div key={btn.id} layout variants={fadeInUp} initial="initial" animate="animate"
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: btn.bgColor || platformInfo.color }}>
                      {btn.customIconUrl ? <img src={btn.customIconUrl} alt="" className="w-6 h-6 object-contain" /> : <IconComp size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{btn.buttonText || platformInfo.name}</h4>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{btn.profileUrl}</p>
                    </div>
                  </div>

                  {btn.username && <p className="text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border w-fit">@{btn.username}</p>}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${btn.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                    {btn.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleTogglePublish(btn)} className="px-3 py-1 rounded-xl text-xs font-bold border hover:bg-gray-100">
                      {btn.status === 'PUBLISHED' ? 'Hide' : 'Publish'}
                    </button>
                    <button onClick={() => openEdit(btn)} className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><FiEdit size={13} /></button>
                    <button onClick={() => setDeleteTarget(btn)} className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><FiTrash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80">
                <h2 className="font-black text-gray-900 text-base">{editingBtn ? 'Edit Social Platform' : '+ Add Social Platform'}</h2>
                <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Select Platform *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p.id} type="button" onClick={() => handlePlatformChange(p.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${form.platform === p.id ? 'bg-amber-400 text-black border-amber-500 shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                        <p.icon size={15} /> <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Account / Store Name</label>
                    <input type="text" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="StyleVerse Official" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Username / Handle</label>
                    <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="styleverse" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Profile Redirect URL *</label>
                  <input type="url" value={form.profileUrl} onChange={e => setForm({ ...form, profileUrl: e.target.value })} required placeholder="https://instagram.com/styleverse" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-mono" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Button Text</label>
                    <input type="text" value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Follow on Instagram" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white">
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-9 h-9 rounded-xl border cursor-pointer" />
                      <input type="text" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-9 h-9 rounded-xl border cursor-pointer" />
                      <input type="text" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border text-xs font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-extrabold">{editingBtn ? 'Update Button' : 'Publish Button'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlobalImageEditor isOpen={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropperSrc} onComplete={url => { setForm({ ...form, customIconUrl: url }); toast.success('Custom Icon updated!'); }} aspectRatio={1} title="Edit Social Icon" showFileSelect={false} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="font-bold text-base mb-2">Delete Social Platform</h3>
            <p className="text-xs text-gray-600 mb-4">Delete button for &quot;{deleteTarget.platform}&quot;?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border rounded-xl text-xs">Cancel</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFollowManager;
