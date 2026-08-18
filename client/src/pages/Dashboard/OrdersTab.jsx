import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiClock, FiCheck, FiTruck, FiX,
  FiChevronRight, FiRefreshCw, FiMapPin, FiCalendar, FiAlertCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/api';
import WriteReviewModal from '../../components/reviews/WriteReviewModal';

const STAGES = [
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const STATUS_CONFIG = {
  PENDING_APPROVAL: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: FiClock, label: 'Pending Approval' },
  PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: FiClock, label: 'Pending' },
  CONFIRMED: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: FiCheck, label: 'Approved' },
  PACKED: { color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: FiPackage, label: 'Packed' },
  SHIPPED: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: FiTruck, label: 'Shipped' },
  OUT_FOR_DELIVERY: { color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20', icon: FiTruck, label: 'Out for Delivery' },
  DELIVERED: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: FiCheck, label: 'Delivered' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: FiX, label: 'Cancelled' },
  REJECTED: { color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', icon: FiX, label: 'Rejected by Admin' },
};

const getStageIndex = (status) => {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

/* ─── Real-Time Cancellation Timer Component ─── */
const CancellationCountdownTimer = ({ order, onCancelled }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!order.cancellationEnd || !order.cancellationAllowed) return;

    const calcLeft = () => {
      const end = new Date(order.cancellationEnd).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setSecondsLeft(calcLeft());

    const interval = setInterval(() => {
      const rem = calcLeft();
      setSecondsLeft(rem);
      if (rem <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [order.cancellationEnd, order.cancellationAllowed]);

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await api.post(`/orders/${order.id}/cancel`, { reason: 'Cancelled by customer during window' });
      toast.success('Order cancelled successfully.');
      setShowConfirmModal(false);
      onCancelled();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (!order.cancellationAllowed || ['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus)) {
    return null;
  }

  if (secondsLeft <= 0) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
        <FiAlertCircle className="w-4 h-4" /> Cancellation Period Expired
      </div>
    );
  }

  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
        <div className="flex-1">
          <p className="text-xs font-bold text-emerald-400">Cancellation Window Active</p>
          <p className="text-[11px] text-emerald-300/80">
            Available For: <strong className="font-mono text-white text-xs">{timeString}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-900 font-extrabold text-xs transition cursor-pointer shadow-lg shrink-0"
        >
          Cancel Order
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-charcoal-900 border border-gold-500/30 max-w-md w-full rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <h3 className="text-lg font-serif font-bold text-white">Cancel Order #{order.orderNumber}?</h3>
              <p className="text-xs text-gray-400">
                Are you sure you want to cancel this order? Stock will be restored and any paid amount will be refunded.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 cursor-pointer"
                >
                  No, Keep Order
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-extrabold text-xs transition cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewTarget, setActiveReviewTarget] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get(`/orders/my-orders?_t=${Date.now()}`)
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const handleSync = () => fetchOrders();
    window.addEventListener('orders_updated', handleSync);
    return () => window.removeEventListener('orders_updated', handleSync);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white/3 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">My Orders</h2>
          <p className="text-white/40 text-xs mt-0.5">{orders.length} total orders placed</p>
        </div>
        <Link to="/orders" className="text-xs text-gold-400 hover:text-gold-300 font-bold transition flex items-center gap-1">
          View All <FiChevronRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/10 flex items-center justify-center mb-4">
            <FiPackage size={28} className="text-gold-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">No Orders Yet</h3>
          <p className="text-white/40 text-xs mb-6">Your order history will appear here dynamically.</p>
          <Link
            to="/categories"
            className="px-6 py-2.5 rounded-xl bg-gold-500 text-charcoal-900 font-extrabold text-xs hover:bg-gold-400 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PENDING;
            const currentStageIdx = getStageIndex(order.orderStatus);
            const isPendingApproval = order.orderStatus === 'PENDING_APPROVAL';
            const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-gold-500/30 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">Order #{order.orderNumber}</span>
                    <p className="text-xs text-white/50">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon size={12} />
                      {cfg.label}
                    </span>
                    <span className="text-sm font-extrabold text-white">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Pending Approval Message Banner */}
                {isPendingApproval && (
                  <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs text-amber-300">
                    ℹ️ <strong>Order Status: Pending Approval</strong> — Your order has been placed successfully and is waiting for admin approval.
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      {item.product?.images?.[0]?.url && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product?.name}
                          className="w-12 h-14 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.product?.name || item.name || 'Product'}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? `· Color: ${item.color}` : ''} · Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gold-400">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        {order.orderStatus === 'DELIVERED' && (
                          <button
                            onClick={() => setActiveReviewTarget({ order, item })}
                            aria-label={`Write a review for ${item.product?.name || item.name || 'Product'}`}
                            className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-[11px] transition cursor-pointer shrink-0 shadow-sm"
                          >
                            ⭐ Write a Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Stage Timeline Progress */}
                {!isCancelled && !isPendingApproval && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Order Lifecycle Progress</p>
                    <div className="grid grid-cols-6 gap-1">
                      {STAGES.map((s, stageIdx) => {
                        const isCompleted = stageIdx <= currentStageIdx;
                        return (
                          <div key={s.key} className="text-center space-y-1">
                            <div className={`h-1.5 rounded-full transition-all ${
                              isCompleted ? 'bg-gold-500 shadow-sm shadow-gold-500/50' : 'bg-white/10'
                            }`} />
                            <span className={`text-[9px] block truncate font-semibold ${
                              isCompleted ? 'text-gold-400' : 'text-white/30'
                            }`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery info */}
                {!isPendingApproval && (order.expectedDeliveryDate || order.courierName || order.trackingNumber) && (
                  <div className="bg-gold-500/10 border border-gold-500/20 p-3 rounded-xl flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 text-gold-300">
                      <FiCalendar className="w-4 h-4 text-gold-400 shrink-0" />
                      <span>
                        Expected Delivery: <strong>{order.expectedDeliveryDate || '3-5 Business Days'}</strong>
                        {order.deliveryTimeSlot ? ` (${order.deliveryTimeSlot})` : ''}
                      </span>
                    </div>
                    {order.trackingNumber && (
                      <div className="text-white/70 font-mono text-[11px]">
                        Courier: <strong>{order.courierName || 'Partner'}</strong> | Tracking: <strong className="text-gold-400">{order.trackingNumber}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Cancellation Timer & Button */}
                {!isPendingApproval && (
                  <CancellationCountdownTimer order={order} onCancelled={fetchOrders} />
                )}

              </motion.div>
            );
          })}
        </div>
      )}

      {activeReviewTarget && (
        <WriteReviewModal
          order={activeReviewTarget.order}
          item={activeReviewTarget.item}
          onClose={() => setActiveReviewTarget(null)}
          onReviewSubmitted={() => fetchOrders()}
        />
      )}
    </div>
  );
};

export default OrdersTab;
