import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiClock, FiCheck, FiTruck, FiX, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../config/api';

const STATUS_CONFIG = {
  PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: FiClock, label: 'Pending' },
  PROCESSING: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: FiRefreshCw, label: 'Processing' },
  SHIPPED: { color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: FiTruck, label: 'Shipped' },
  DELIVERED: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: FiCheck, label: 'Delivered' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: FiX, label: 'Cancelled' },
};

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/3 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">My Orders</h2>
          <p className="text-white/40 text-sm">{orders.length} orders placed</p>
        </div>
        <Link to="/orders" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
          View All <FiChevronRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
            <FiPackage size={28} className="text-yellow-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Orders Yet</h3>
          <p className="text-white/40 text-sm mb-6">Your order history will appear here.</p>
          <Link
            to="/categories"
            className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 8).map((order, i) => {
            const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PENDING;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/3 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <FiPackage size={16} className="text-white/50" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">#{order.orderNumber}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white font-bold">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon size={10} />
                      {cfg.label}
                    </span>
                    <FiChevronRight size={14} className="text-white/30" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
