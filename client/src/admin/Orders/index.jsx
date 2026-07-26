/**
 * Admin Orders Dashboard — Full Order Management with WhatsApp & Email hooks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiFilter, FiEye, FiEdit2, FiPhone, FiMail,
  FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiDownload, FiPrinter, FiX, FiChevronDown, FiMapPin, FiClock
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

/* ─── Status metadata ─────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  WHATSAPP_PENDING: { label: 'WhatsApp Pending',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  CONFIRMED:        { label: 'Confirmed',         color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  PACKED:           { label: 'Packed',            color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  SHIPPED:          { label: 'Shipped',           color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  DELIVERED:        { label: 'Delivered',         color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  WHATSAPP_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'CANCELLED'],
  PACKED:           ['SHIPPED'],
  SHIPPED:          ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Order Detail Side Panel ─────────────────────────────── */
const OrderDetail = ({ order, onClose, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(order?.expectedDeliveryDate || '');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(order?.deliveryTimeSlot || '');
  const [internalNotes, setInternalNotes] = useState(order?.notes || '');

  const nextStatuses = TRANSITIONS[order?.orderStatus] || ALL_STATUSES;

  const handleUpdate = async () => {
    if (!selectedStatus && !expectedDeliveryDate && !courierName) {
      toast.error('Please select a status or update delivery details');
      return;
    }
    try {
      setUpdating(true);
      const payload = {};
      if (selectedStatus) payload.orderStatus = selectedStatus;
      if (courierName) payload.courierName = courierName;
      if (trackingNumber) payload.trackingNumber = trackingNumber;
      if (cancelReason) payload.cancelReason = cancelReason;
      if (expectedDeliveryDate) payload.expectedDeliveryDate = expectedDeliveryDate;
      if (deliveryTimeSlot) payload.deliveryTimeSlot = deliveryTimeSlot;
      if (internalNotes) payload.internalNotes = internalNotes;

      const { data } = await api.put(`/orders/admin/${order.id}/status`, payload);

      // Generate WhatsApp Deeplink Message
      const customerPhone = (order.user?.phone || order.user?.whatsappNumber || order.address?.phone || '').replace(/\D/g, '');
      if (customerPhone) {
        const itemNames = (order.items || []).map(i => `• ${i.product?.name || 'Item'} (Size: ${i.size || 'N/A'}, Qty: ${i.quantity})`).join('\n');
        const waMsg = encodeURIComponent(
          `Hello ${order.user?.fullName || 'Valued Customer'},\n\n` +
          `✅ Your Order *#${order.orderNumber}* status has been updated to *${(selectedStatus || order.orderStatus).replace(/_/g, ' ')}*!\n\n` +
          `📦 *Items Purchased:*\n${itemNames}\n\n` +
          `💰 *Total Amount:* ₹${order.totalAmount?.toLocaleString('en-IN')}\n` +
          `📅 *Expected Delivery:* ${expectedDeliveryDate || order.expectedDeliveryDate || '3-5 Business Days'}\n` +
          `⏰ *Time Slot:* ${deliveryTimeSlot || order.deliveryTimeSlot || '10:00 AM - 6:00 PM'}\n` +
          (trackingNumber ? `🚚 *Courier:* ${courierName || 'Partner'} (Tracking ID: ${trackingNumber})\n` : '') +
          `\nThank you for shopping with StyleVerse! 🌸`
        );
        const waLink = `https://wa.me/${customerPhone}?text=${waMsg}`;

        toast.info(
          <div>
            Order updated successfully!
            <a href={waLink} target="_blank" rel="noreferrer" className="block mt-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold text-center">
              📱 Click to Send WhatsApp Confirmation
            </a>
          </div>,
          { autoClose: 10000 }
        );
      } else {
        toast.success(`Order status updated to ${selectedStatus || order.orderStatus}`);
      }

      onStatusUpdate(order.id, data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return null;
  const addr = order.address;
  const user = order.user;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-black text-gray-900">#{order.orderNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.orderStatus} />
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
              <FiX size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Customer</p>
            <p className="font-bold text-gray-900">{user?.fullName}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {user?.email && (
                <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <FiMail size={11} /> {user.email}
                </a>
              )}
              {user?.phone && (
                <a href={`tel:${user.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:underline">
                  <FiPhone size={11} /> {user.phone}
                </a>
              )}
              {user?.whatsappNumber && (
                <a
                  href={`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:underline font-bold"
                >
                  <FaWhatsapp size={12} /> {user.whatsappNumber}
                </a>
              )}
            </div>
          </div>

          {/* Delivery address */}
          {addr && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FiMapPin size={11} /> Delivery Address
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">
              {addr.street}<br />
              {addr.city}, {addr.state} — {addr.postalCode}<br />
              {addr.country || 'India'}
            </p>
            </div>
          )}

          {/* Products */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Products</p>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex gap-3 bg-gray-50 p-3 rounded-2xl">
                  {item.product?.images?.[0]?.url && (
                    <img src={item.product.images[0].url} alt={item.product?.name}
                      className="w-14 h-16 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.product?.name || 'Product'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.color && <span className="text-[10px] px-2 py-0.5 bg-gray-200 rounded-full">{item.color}</span>}
                      {item.size && <span className="text-[10px] px-2 py-0.5 bg-gray-200 rounded-full">Size: {item.size}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>−{formatCurrency(order.discountAmount)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span></div>
            <div className="flex justify-between font-black text-base text-gray-900 border-t border-yellow-200 pt-2 mt-1">
              <span>Grand Total</span><span className="text-yellow-600">{formatCurrency(order.totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Payment: <strong>{order.paymentMethod}</strong> · Status: <strong>{order.paymentStatus}</strong></p>
            {order.couponCode && <p className="text-xs text-gray-500">Coupon: <strong>{order.couponCode}</strong></p>}
            {order.notes && <p className="text-xs text-gray-500 mt-2 bg-white p-2 rounded-lg">📝 {order.notes}</p>}
          </div>

          {/* Tracking info */}
          {(order.courierName || order.trackingNumber) && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">Shipment Info</p>
              {order.courierName && <p className="text-sm text-blue-800">Courier: <strong>{order.courierName}</strong></p>}
              {order.trackingNumber && <p className="text-sm text-blue-800">Tracking: <strong className="font-mono">{order.trackingNumber}</strong></p>}
            </div>
          )}

          {/* Status update */}
          {nextStatuses.length > 0 && (
            <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={13} /> Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map(s => (
                  <button key={s} onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition
                      ${selectedStatus === s ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>

              {/* Delivery & Tracking Controls */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-700">Delivery Schedule & Courier Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Expected Delivery Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 15 August 2026"
                      value={expectedDeliveryDate}
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Delivery Time Slot</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM – 1:00 PM"
                      value={deliveryTimeSlot}
                      onChange={e => setDeliveryTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input value={courierName} onChange={e => setCourierName(e.target.value)}
                    placeholder="Courier name (e.g. Blue Dart)" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                  <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="Tracking ID (e.g. BD123456789)" className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono" />
                </div>
              </div>

              {selectedStatus === 'CANCELLED' && (
                <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs" />
              )}

              <button
                onClick={handleUpdate}
                disabled={!selectedStatus || updating}
                className="w-full py-3 rounded-2xl bg-yellow-400 text-black font-black text-sm hover:bg-yellow-300 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {updating
                  ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Updating...</>
                  : 'Apply Status Update'}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                📧 Customer email + 📱 WhatsApp message will be generated automatically
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Admin Orders Page ─────────────────────────────────── */
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      const { data } = await api.get(`/orders/admin/all?${params}`);
      setOrders(data.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 400);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const handleStatusUpdate = (orderId, updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.orderStatus === s).length;
    return acc;
  }, {});

  const whatsappOrders = orders.filter(o => o.orderStatus === 'WHATSAPP_PENDING');

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all online & WhatsApp orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition">
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* WhatsApp orders alert */}
      {whatsappOrders.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
            <FaWhatsapp size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-green-800">
              {whatsappOrders.length} WhatsApp Order{whatsappOrders.length > 1 ? 's' : ''} Awaiting Confirmation
            </p>
            <p className="text-xs text-green-600">Customers sent orders via WhatsApp — review and confirm below</p>
          </div>
          <button onClick={() => setFilterStatus('WHATSAPP_PENDING')}
            className="px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition">
            View All
          </button>
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition
            ${filterStatus === '' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
          All ({orders.length})
        </button>
        {ALL_STATUSES.map(s => counts[s] > 0 && (
          <button key={s} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition
              ${filterStatus === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s]?.dot}`} />
            {STATUS_CONFIG[s]?.label} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order number, customer name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        />
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl">
          <FiPackage size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  const isWA = order.orderStatus === 'WHATSAPP_PENDING';
                  return (
                    <tr key={order.id}
                      className={`hover:bg-gray-50 transition cursor-pointer ${isWA ? 'bg-green-50/40' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {isWA && <FaWhatsapp size={13} className="text-green-500 flex-shrink-0" />}
                          <span className="text-sm font-bold text-gray-900 font-mono">#{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-800">{order.user?.fullName}</p>
                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                        {order.user?.whatsappNumber && (
                          <a href={`https://wa.me/${order.user.whatsappNumber.replace(/\D/g,'')}`}
                            target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-green-600 flex items-center gap-0.5 mt-0.5 hover:underline">
                            <FaWhatsapp size={9} /> {order.user.whatsappNumber}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex -space-x-2">
                          {(order.items || []).slice(0, 3).map((item, i) => item.product?.images?.[0]?.url ? (
                            <img key={i} src={item.product.images[0].url}
                              className="w-8 h-8 rounded-lg object-cover border-2 border-white" alt="" />
                          ) : null)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-600">{order.paymentMethod}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                          {order.paymentStatus}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition"
                        >
                          <FiEye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail panel */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
