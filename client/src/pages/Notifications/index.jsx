import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiCheck, FiCheckCircle, FiPackage, FiTag, FiInfo } from 'react-icons/fi';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications/my-notifications');
      if (data?.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
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

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'ORDER') return n.type === 'ORDER';
    if (filterType === 'PROMOTIONAL') return n.type === 'PROMOTIONAL';
    return true;
  });

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <FiBell className="text-gold-600" /> Notification Center
            </h1>
            <p className="text-xs text-gray-500 mt-1">Real-time updates on your orders, offers, and store alerts</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-full bg-gold-50 text-gold-800 text-xs font-bold border border-gold-200 hover:bg-gold-100 transition flex items-center gap-1.5"
            >
              <FiCheckCircle /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['ALL', 'UNREAD', 'ORDER', 'PROMOTIONAL'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filterType === t ? 'bg-charcoal-900 text-gold-400 shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100">
            No notifications found under this tab.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition flex gap-4 items-start ${
                  !n.isRead ? 'bg-gold-50/40 border-gold-200 shadow-sm' : 'bg-white border-gray-200'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-gold-100 text-gold-700 shrink-0 mt-0.5">
                  {n.type === 'ORDER' ? <FiPackage className="w-5 h-5" /> : <FiTag className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-charcoal-900">{n.title}</h3>
                    <span className="text-[10px] text-gray-400">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-gold-600 hover:text-gold-800 text-xs font-bold p-1 rounded hover:bg-gold-100"
                    title="Mark Read"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
