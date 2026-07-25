import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiPackage, FiTag, FiAlertCircle, FiCheck, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';

const TYPE_CONFIG = {
  ORDER: { icon: FiPackage, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  OFFER: { icon: FiTag, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  SYSTEM: { icon: FiAlertCircle, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  DEFAULT: { icon: FiBell, color: 'text-white/50', bg: 'bg-white/5' },
};

const NotificationsTab = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifs(data.data || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-white/40 text-sm">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => notifs.filter(n => !n.isRead).forEach(n => markRead(n.id))}
            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
          >
            <FiCheck size={11} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
            <FiBell size={28} className="text-yellow-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">All Caught Up!</h3>
          <p className="text-white/40 text-sm">No notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((notif, i) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.DEFAULT;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => !notif.isRead && markRead(notif.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.isRead
                    ? 'border-white/5 bg-white/2 opacity-60'
                    : 'border-white/8 bg-white/4 hover:border-white/12'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <cfg.icon size={14} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${notif.isRead ? 'text-white/50' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-white/25 mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
