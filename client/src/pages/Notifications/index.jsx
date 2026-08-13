import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiCheckCircle, FiPackage, FiTag, FiTrash2, FiRefreshCw, FiArrowRight, FiExternalLink } from 'react-icons/fi';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-toastify';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [isClearing, setIsClearing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications/my-notifications');
      if (data?.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      setIsClearing(true);
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared successfully');
    } catch (err) {
      toast.error('Failed to clear notifications');
    } finally {
      setIsClearing(false);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    } else if (n.type === 'ORDER') {
      navigate('/orders');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'ORDER') return n.type === 'ORDER' || n.type === 'ADMIN_ORDER';
    if (filterType === 'PROMOTIONAL') return n.type === 'PROMOTIONAL';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d0d12] text-white py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30">
                <FiBell className="w-6 h-6" />
              </span>
              <span>Notification Center</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Real-time status updates on your orders, shipments, and store alerts</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchNotifications}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              title="Refresh Notifications"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/30 hover:bg-amber-400/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiCheckCircle size={14} /> Mark All Read ({unreadCount})
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FiTrash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'ORDER', label: 'Orders' },
            { id: 'PROMOTIONAL', label: 'Promotions' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                filterType === t.id
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-black'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/5">
            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/5 space-y-3">
            <FiBell className="w-10 h-10 text-amber-400/40 mx-auto" />
            <h3 className="text-base font-bold text-white">No notifications in this view</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {filterType === 'ALL'
                ? 'Your notifications will appear here when you place orders, receive status updates, or get exclusive promotions.'
                : `No ${filterType.toLowerCase()} notifications found.`}
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition mt-2"
            >
              Start Shopping <FiArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-5 rounded-2xl border transition-all flex gap-4 items-start cursor-pointer group ${
                    !n.isRead
                      ? 'bg-gradient-to-r from-amber-400/10 via-white/5 to-white/5 border-amber-400/40 shadow-lg shadow-amber-400/5'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 mt-0.5 ${
                    !n.isRead ? 'bg-amber-400 text-black shadow' : 'bg-white/10 text-amber-400'
                  }`}>
                    {n.type === 'ORDER' || n.type === 'ADMIN_ORDER' ? (
                      <FiPackage className="w-5 h-5" />
                    ) : (
                      <FiTag className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm ${!n.isRead ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium shrink-0">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                      {n.message}
                    </p>

                    {(n.link || n.type === 'ORDER') && (
                      <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                        <span>View Order Details</span>
                        <FiArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Actions (Mark Read & Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/20 transition cursor-pointer"
                        title="Mark as Read"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                      title="Delete Notification"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

