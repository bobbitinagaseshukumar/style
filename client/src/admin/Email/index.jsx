import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiPlus, FiSend, FiTrash2, FiEdit2, FiCopy, FiCheck,
  FiX, FiEye, FiFilter, FiSearch, FiRefreshCw, FiGrid, FiUsers,
  FiZap, FiTag, FiGift, FiStar, FiClock, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

const CAMPAIGN_TYPES = [
  { id: 'FESTIVAL_SALE', label: 'Festival Sale Offers', icon: '🎆' },
  { id: 'MEGA_SALE', label: 'Mega Sale Promotion', icon: '🔥' },
  { id: 'FLASH_SALE', label: 'Flash Sale (Limited Time)', icon: '⚡' },
  { id: 'NEW_ARRIVALS', label: 'New Arrivals Collection', icon: '✨' },
  { id: 'TRENDING', label: 'Latest Trending Products', icon: '🌟' },
  { id: 'EXCLUSIVE_OFFER', label: 'Exclusive VIP Member Offers', icon: '💎' },
  { id: 'CLEARANCE', label: 'Clearance Discount Sale', icon: '🏷️' },
  { id: 'NEWSLETTER', label: 'Weekly Fashion Newsletter', icon: '📰' },
];

const AUDIENCE_OPTIONS = [
  { id: 'ALL', label: 'All Customers (Opted-in)' },
  { id: 'NEWSLETTER', label: 'Newsletter Subscribers Only' },
  { id: 'CATEGORY_INTEREST', label: 'Customers by Category Interest' },
  { id: 'PURCHASE_HISTORY', label: 'Customers with Past Purchases' },
  { id: 'WISHLIST', label: 'Customers with Items in Wishlist' },
  { id: 'ACTIVE_USERS', label: 'Active Users (Logged in last 30 days)' },
];

const AdminEmailManagement = () => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'history'
  const [campaigns, setCampaigns] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  // Campaign Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    bannerImage: '',
    description: '',
    buttonText: 'Explore Collection Now',
    buttonUrl: '/offers',
    campaignType: 'FESTIVAL_SALE',
    targetAudience: 'ALL',
    productIds: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campRes, logsRes, prodRes] = await Promise.allSettled([
        api.get('/email/campaigns'),
        api.get('/email/history'),
        api.get('/products?limit=50')
      ]);

      if (campRes.status === 'fulfilled' && campRes.value.data?.data) {
        setCampaigns(campRes.value.data.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.data?.logs) {
        setEmailLogs(logsRes.value.data.data.logs);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data?.data?.products) {
        setProducts(prodRes.value.data.data.products);
      }
    } catch (err) {
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      subject: '',
      bannerImage: '',
      description: '',
      buttonText: 'Explore Collection Now',
      buttonUrl: '/offers',
      campaignType: 'FESTIVAL_SALE',
      targetAudience: 'ALL',
      productIds: [],
    });
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.description) {
      toast.error('Title, subject, and description are required.');
      return;
    }

    try {
      if (editingCampaign) {
        await api.put(`/email/campaigns/${editingCampaign.id}`, formData);
        toast.success('Campaign updated!');
      } else {
        await api.post('/email/campaigns', formData);
        toast.success('Email campaign created!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save campaign');
    }
  };

  const handleSendCampaignNow = async (id) => {
    if (!window.confirm('Send this email campaign to target customers now?')) return;
    try {
      setSendingId(id);
      const res = await api.post(`/email/campaigns/${id}/send`);
      toast.success(res.data?.message || 'Campaign emails queued & sent!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/email/campaigns/${id}`);
      toast.success('Campaign deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  const toggleProductSelect = (prodId) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(prodId);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((i) => i !== prodId) : [...prev.productIds, prodId],
      };
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-charcoal-900 border border-gold-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-gold-400 font-bold text-lg">
            <FiMail className="w-6 h-6" />
            <span>Email Campaigns & Promotional Notifications</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Create promotional sales campaigns, target specific customer segments, promote products, and view delivery history.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-sm hover:from-gold-400 shadow-lg flex items-center gap-2 transition"
        >
          <FiPlus className="w-4 h-4" /> Create Email Campaign
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'campaigns' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Email Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'history' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Delivery History Logs ({emailLogs.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <FiRefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      ) : activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const typeObj = CAMPAIGN_TYPES.find((t) => t.id === c.campaignType);
            const isSending = sendingId === c.id;

            return (
              <motion.div
                key={c.id}
                layout
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-gold-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1">
                      <span>{typeObj?.icon || '📢'}</span> {typeObj?.label || c.campaignType}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        c.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{c.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">Subject: &quot;{c.subject}&quot;</p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-2">{c.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Audience: <strong>{c.targetAudience}</strong></span>
                    <span>Sent: <strong className="text-emerald-600">{c.sentCount}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendCampaignNow(c.id)}
                      disabled={isSending}
                      className="flex-1 py-2 px-3 rounded-xl bg-charcoal-900 text-gold-400 font-bold text-xs hover:bg-black transition flex items-center justify-center gap-1.5 shadow"
                    >
                      {isSending ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                      Send Now
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete Campaign"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* History Logs Tab */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Recipient Email</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{log.recipientEmail}</td>
                    <td className="px-4 py-3 text-gray-800">{log.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{log.campaign?.title || 'System Notification'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 bg-charcoal-900 border-b border-white/10 flex items-center justify-between text-white">
                <h3 className="font-bold text-base text-gold-400">Create Email Campaign</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Campaign Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diwali Heritage Sale 2026"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ⚡ Flat 50% Off on Heritage Collections"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Campaign Type
                    </label>
                    <select
                      value={formData.campaignType}
                      onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs"
                    >
                      {CAMPAIGN_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs"
                    >
                      {AUDIENCE_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Description / Body
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write compelling sales pitch description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>

                {/* Promote Products Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Promote Specific Products in Email (Select Products)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                    {products.map((p) => {
                      const isSelected = formData.productIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelect(p.id)}
                          className={`p-2 rounded-lg border cursor-pointer transition text-xs ${
                            isSelected ? 'bg-amber-100 border-amber-500 font-bold' : 'bg-white border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <p className="truncate text-[11px]">{p.name}</p>
                          <p className="text-[10px] text-amber-700 font-bold">₹{p.price}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:from-gold-400 shadow-lg"
                  >
                    Save Campaign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEmailManagement;
