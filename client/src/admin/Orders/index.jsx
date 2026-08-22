/**
 * Admin Orders Dashboard — Full Order Management with WhatsApp & Email hooks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiFilter, FiEye, FiEdit2, FiPhone, FiMail,
  FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiDownload, FiPrinter, FiX, FiChevronDown, FiMapPin, FiClock,
  FiTrash2, FiAlertTriangle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

/* ─── Status metadata ─────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border border-amber-300', dot: 'bg-amber-500' },
  PENDING:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  WHATSAPP_PENDING: { label: 'WhatsApp Pending',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  CONFIRMED:        { label: 'Confirmed',         color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  PACKED:           { label: 'Packed',            color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  SHIPPED:          { label: 'Shipped',           color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  DELIVERED:        { label: 'Delivered',         color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  REJECTED:         { label: 'Rejected',          color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const TRANSITIONS = {
  PENDING_APPROVAL: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  WHATSAPP_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
  REJECTED:         [],
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
const OrderDetail = ({ order, onClose, onStatusUpdate, onOpenCancelModal, onDeleteTarget }) => {
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(order?.expectedDeliveryDate || '');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(order?.deliveryTimeSlot || '');
  const [internalNotes, setInternalNotes] = useState(order?.notes || '');
  const [courierName, setCourierName] = useState(order?.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [cancelReason, setCancelReason] = useState('');
  const [cancellationAllowed, setCancellationAllowed] = useState(false);
  const [cancellationDuration, setCancellationDuration] = useState(60);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      if (cancellationAllowed !== undefined) payload.cancellationAllowed = cancellationAllowed;
      if (cancellationAllowed && cancellationDuration) payload.cancellationDuration = cancellationDuration;

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

  const handleApproveSubmit = async () => {
    try {
      setUpdating(true);
      const payload = {
        deliveryDate: expectedDeliveryDate,
        deliveryTime: deliveryTimeSlot,
        deliveryNotes: internalNotes,
        cancellationAllowed,
        cancellationDurationMinutes: cancellationDuration
      };
      const { data } = await api.put(`/orders/admin/${order.id}/approve`, payload);
      toast.success('Order approved successfully');
      onStatusUpdate(order.id, data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setUpdating(true);
      const { data } = await api.put(`/orders/admin/${order.id}/reject`, { reason: rejectReason });
      toast.success('Order rejected');
      onStatusUpdate(order.id, { ...order, orderStatus: 'REJECTED' });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
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

          {/* Cancellation Info */}
          {order.cancellationAllowed && order.cancellationEnd && (
            <div className={`rounded-2xl p-4 border ${new Date(order.cancellationEnd) > new Date() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 text-gray-500">
                <FiClock size={11} /> Cancellation Window
              </p>
              <p className="text-sm font-bold text-gray-800">
                Until {new Date(order.cancellationEnd).toLocaleString('en-IN')}
              </p>
              <p className={`text-xs mt-1 ${new Date(order.cancellationEnd) > new Date() ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                {new Date(order.cancellationEnd) > new Date() ? 'Active (Customer can cancel)' : 'Expired'}
              </p>
            </div>
          )}

          {/* Pending Approval Actions */}
          {order.orderStatus === 'PENDING_APPROVAL' && (
            <div className="border border-amber-200 rounded-2xl p-4 space-y-3 bg-amber-50">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <FiCheckCircle size={14} /> Pending Approval Actions
              </p>
              
              {!isApproving && !isRejecting && (
                <div className="flex gap-2">
                  <button onClick={() => setIsApproving(true)} className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition">
                    Approve Order
                  </button>
                  <button onClick={() => setIsRejecting(true)} className="flex-1 py-2 rounded-xl bg-red-100 text-red-600 font-bold text-xs hover:bg-red-200 transition">
                    Reject Order
                  </button>
                </div>
              )}

              {isApproving && (
                <div className="space-y-3 pt-2 border-t border-amber-200/50">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 uppercase">Delivery Date</label>
                      <input type="text" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs" placeholder="e.g. 15 Aug" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 uppercase">Delivery Time</label>
                      <input type="text" value={deliveryTimeSlot} onChange={e => setDeliveryTimeSlot(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs" placeholder="10 AM - 1 PM" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Delivery Notes</label>
                    <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs" rows="2" placeholder="Notes..." />
                  </div>
                  <div className="flex items-center justify-between bg-white/50 border border-amber-200 p-2 rounded-xl">
                    <span className="text-xs font-bold text-amber-800">Enable Cancellation</span>
                    <input type="checkbox" checked={cancellationAllowed} onChange={e => setCancellationAllowed(e.target.checked)} className="w-4 h-4 text-amber-500 rounded" />
                  </div>
                  {cancellationAllowed && (
                    <div className="mt-2 space-y-1.5">
                      <label className="block text-[10px] font-bold text-amber-700 uppercase">Cancellation Window (Type Minutes)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="10080"
                          value={cancellationDuration}
                          onChange={e => setCancellationDuration(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-28 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white text-gray-900"
                          placeholder="e.g. 13"
                        />
                        <span className="text-xs font-bold text-amber-800">Minutes</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {[13, 15, 30, 45, 60, 120, 1440].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCancellationDuration(m)}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition border ${
                              cancellationDuration === m
                                ? 'bg-amber-500 text-black border-amber-500'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {m < 60 ? `${m}m` : `${m / 60}h`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setIsApproving(false)} className="px-4 py-2 rounded-xl bg-white text-gray-600 font-bold text-xs border border-amber-200 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleApproveSubmit} disabled={updating} className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 disabled:opacity-50">
                      {updating ? 'Approving...' : 'Confirm Approval'}
                    </button>
                  </div>
                </div>
              )}

              {isRejecting && (
                <div className="space-y-3 pt-2 border-t border-amber-200/50">
                  <div>
                    <label className="block text-[10px] font-bold text-red-700 uppercase mb-1">Rejection Reason</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs" rows="2" placeholder="Reason..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsRejecting(false)} className="px-4 py-2 rounded-xl bg-white text-gray-600 font-bold text-xs border border-red-200 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleRejectSubmit} disabled={updating} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-50">
                      {updating ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REJECTED ORDER CONTROLS & PERMANENT DELETION */}
          {order.orderStatus === 'REJECTED' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                <FiAlertTriangle className="text-rose-600 w-4 h-4 shrink-0" /> Order Rejected by Admin
              </div>
              {order.cancellationReason && (
                <p className="text-xs text-rose-700 bg-white/80 p-2.5 rounded-xl border border-rose-200/70">
                  <span className="font-bold">Rejection Reason:</span> {order.cancellationReason}
                </p>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                This order is safely stored in the database under Rejected Orders. To delete it permanently from the database and remove all its items, click below.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onDeleteTarget) onDeleteTarget(order);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FiTrash2 size={13} /> Delete Permanently from Database
              </button>
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

              {/* Cancellation Window Controls */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between bg-[#141414] border border-white/10 p-3 rounded-xl text-white">
                  <div>
                    <p className="text-xs font-bold text-gray-100">Enable Customer Cancellation</p>
                    <p className="text-[10px] text-gray-400">Allow user to cancel from their dashboard</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cancellationAllowed}
                    onChange={(e) => setCancellationAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer accent-amber-500"
                  />
                </div>
                {cancellationAllowed && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Cancellation Window (Type Custom Minutes)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        value={cancellationDuration}
                        onChange={e => setCancellationDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-28 px-3 py-2 rounded-xl bg-[#141414] text-white border border-white/20 text-xs font-bold focus:outline-none focus:border-amber-500"
                        placeholder="e.g. 13"
                      />
                      <span className="text-xs font-bold text-amber-400">Minutes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[13, 15, 30, 45, 60, 120, 1440].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCancellationDuration(m)}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition border ${
                            cancellationDuration === m
                              ? 'bg-amber-500 text-black border-amber-500'
                              : 'bg-[#141414] text-white border border-white/10 hover:border-amber-500/50'
                          }`}
                        >
                          {m < 60 ? `${m}m` : `${m / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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

          {/* Admin Direct Cancellation with Apology */}
          {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancelModal(order);
                }}
                className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <FiXCircle size={15} /> Cancel Order & Send Apology to Customer
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Admin Order Approval & Cancellation Config Modal ───── */
const ApproveOrderModal = ({ order, onClose, onApproved }) => {
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || '15 August 2026');
  const [deliveryTime, setDeliveryTime] = useState(order?.deliveryTime || '10:00 AM – 1:00 PM');
  const [packingDate, setPackingDate] = useState(order?.packingDate || '15 August 2026, 04:00 PM');
  const [shippingDate, setShippingDate] = useState(order?.shippingDate || '16 August 2026, 10:00 AM');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [cancellationAllowed, setCancellationAllowed] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/orders/admin/${order.id}/approve`, {
        deliveryDate,
        deliveryTime,
        packingDate,
        shippingDate,
        deliveryNotes,
        cancellationAllowed,
        cancellationDurationMinutes: durationMinutes,
      });

      toast.success('Order Approved & Delivery Timelines Configured!');
      onApproved(order.id, res.data?.data);
      onClose();
    } catch (err) {
      console.error('Approve order error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-charcoal-900 p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">Order Approval & Schedule Control</span>
            <h3 className="font-serif font-bold text-lg">Approve Order #{order.orderNumber}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold">✕</button>
        </div>

        <form onSubmit={handleApprove} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Packing & Shipping Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Packing Date & Time</label>
              <input
                type="text"
                placeholder="e.g. 15 August 2026, 04:00 PM"
                value={packingDate}
                onChange={(e) => setPackingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Shipping Date & Time</label>
              <input
                type="text"
                placeholder="e.g. 16 August 2026, 10:00 AM"
                value={shippingDate}
                onChange={(e) => setShippingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          {/* Delivery Date & Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estimated Delivery Date</label>
              <input
                type="text"
                required
                placeholder="e.g. 17 August 2026"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delivery Time Slot</label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM – 1:00 PM"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
          </div>

          {/* Cancellation Window Configuration */}
          <div className="p-4 bg-gold-50/80 border border-gold-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-charcoal-900">Allow Customer Cancellation Window</p>
                <p className="text-[10px] text-gray-500">If enabled, customer can cancel during allowed time limit.</p>
              </div>
              <input
                type="checkbox"
                checked={cancellationAllowed}
                onChange={(e) => setCancellationAllowed(e.target.checked)}
                className="w-5 h-5 rounded text-gold-500 cursor-pointer accent-gold-500"
              />
            </div>

            {cancellationAllowed && (
              <div className="space-y-2.5 pt-2 border-t border-gold-200">
                <label className="block text-[10px] font-bold text-gray-700 uppercase">Set Cancellation Window (Type Custom Minutes or Pick Preset)</label>
                
                {/* Typable Minutes Input */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gold-300 shadow-sm">
                  <span className="text-xs font-bold text-gray-700">Custom Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-gold-400 text-xs font-bold text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="e.g. 13"
                  />
                  <span className="text-xs font-bold text-amber-700">Minutes</span>
                </div>

                {/* Preset Duration Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: '13 Mins', value: 13 },
                    { label: '30 Mins', value: 30 },
                    { label: '1 Hour', value: 60 },
                    { label: '2 Hours', value: 120 },
                    { label: '6 Hours', value: 360 },
                    { label: '12 Hours', value: 720 },
                    { label: '24 Hours', value: 1440 },
                    { label: '48 Hours', value: 2880 },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setDurationMinutes(p.value)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        durationMinutes === p.value ? 'bg-gold-500 text-charcoal-900 border-gold-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-gold-500 text-charcoal-900 font-extrabold text-xs hover:bg-gold-400 transition cursor-pointer"
            >
              {submitting ? 'Approving...' : 'Confirm Approval & Open Window'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ─── Main Admin Orders Page ─────────────────────────────────── */
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [approvalModalOrder, setApprovalModalOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [apologyReason, setApologyReason] = useState('');

  const handleAdminCancelSubmit = async () => {
    if (!cancelModalOrder) return;
    if (!apologyReason.trim()) {
      toast.error('Please provide an apology reason for the customer');
      return;
    }
    try {
      setCancellingOrder(true);
      await api.post(`/orders/admin/${cancelModalOrder.id}/cancel`, {
        reason: apologyReason.trim()
      });
      toast.success(`Order #${cancelModalOrder.orderNumber || cancelModalOrder.id.substring(0,8)} cancelled & apology email dispatched!`);
      setCancelModalOrder(null);
      setApologyReason('');
      fetchOrders();
      try {
        window.dispatchEvent(new Event('kvlr:content-updated'));
      } catch (e) {}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order? Stock will be restored.')) return;
    try {
      await api.put(`/orders/admin/${orderId}/reject`, { reason: 'Rejected by Admin' });
      toast.success('Order rejected');
      fetchOrders();
      try {
        window.dispatchEvent(new Event('kvlr:content-updated'));
      } catch (e) {}
    } catch (err) {
      toast.error('Failed to reject order');
    }
  };

  const handleDeleteOrder = async (hardDelete = false) => {
    if (!deleteTarget) return;
    try {
      setDeletingOrder(true);
      await api.delete(`/orders/admin/${deleteTarget.id}${hardDelete ? '?hardDelete=true' : ''}`);
      toast.success(hardDelete ? `Order #${deleteTarget.orderNumber || deleteTarget.id.substring(0,8)} permanently deleted` : `Order removed from admin panel`);
      setDeleteTarget(null);
      fetchOrders();
      try {
        window.dispatchEvent(new Event('kvlr:content-updated'));
        window.dispatchEvent(new CustomEvent('orders_updated'));
      } catch (e) {}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(false);
    }
  };

  const [statusCounts, setStatusCounts] = useState({});
  const [totalAllOrders, setTotalAllOrders] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      const res = await api.get(`/orders/admin/all?${params}`);
      const list = res.data?.data || res.data?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
      if (res.data?.statusCounts) {
        setStatusCounts(res.data.statusCounts);
        const sum = Object.values(res.data.statusCounts).reduce((a, b) => a + b, 0);
        setTotalAllOrders(sum);
      }
    } catch (err) {
      console.error('Admin orders load notification:', err.message);
      setOrders([]);
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
    acc[s] = statusCounts[s] !== undefined ? statusCounts[s] : orders.filter(o => o.orderStatus === s).length;
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
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer">
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
            className="px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition cursor-pointer">
            View All
          </button>
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer
            ${filterStatus === '' ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'}`}>
          All ({totalAllOrders || orders.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = counts[s] || 0;
          return (
            <button key={s} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer
                ${filterStatus === s ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s]?.dot}`} />
              {STATUS_CONFIG[s]?.label} ({count})
            </button>
          );
        })}
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
          <div className="overflow-x-auto table-responsive w-full">
            <table className="w-full min-w-[800px]">
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
                        <div className="flex items-center gap-1.5">
                          {order.orderStatus === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setApprovalModalOrder(order); }}
                                className="px-2.5 py-1 rounded-xl bg-gold-500 text-charcoal-900 text-xs font-extrabold hover:bg-gold-400 transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRejectOrder(order.id); }}
                                className="px-2.5 py-1 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                          >
                            <FiEye size={12} /> View
                          </button>
                          {order.orderStatus === 'REJECTED' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(order);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow-sm"
                              title="Delete permanently from database"
                            >
                              <FiTrash2 size={12} /> Delete Permanently
                            </button>
                          ) : (
                            <>
                              {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setCancelModalOrder(order); setApologyReason(''); }}
                                  className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                                  title="Cancel Order & Send Apology Email"
                                >
                                  <FiXCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteTarget(order); }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                                title="Delete Order"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
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
            onOpenCancelModal={(order) => {
              setCancelModalOrder(order);
              setApologyReason('');
            }}
            onDeleteTarget={setDeleteTarget}
          />
        )}
        {approvalModalOrder && (
          <ApproveOrderModal
            order={approvalModalOrder}
            onClose={() => setApprovalModalOrder(null)}
            onApproved={handleStatusUpdate}
          />
        )}
      </AnimatePresence>

      {/* CANCEL ORDER & SEND APOLOGY MODAL */}
      <AnimatePresence>
        {cancelModalOrder && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                    <FiXCircle className="text-red-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Cancel Order & Send Apology</h3>
                    <p className="text-xs text-gray-500">#{cancelModalOrder.orderNumber || cancelModalOrder.id.substring(0, 8)} · {formatCurrency(cancelModalOrder.totalAmount)}</p>
                  </div>
                </div>
                <button onClick={() => setCancelModalOrder(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition cursor-pointer">
                  <FiX size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    💡 <strong>Apology Notification:</strong> Cancelling will restore product inventory, refund online payments, and automatically dispatch a respectful apology email and in-app notification to <strong>{cancelModalOrder.user?.fullName || 'the customer'}</strong> ({cancelModalOrder.user?.email || 'Registered Email'}).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Quick Apology Presets (Click to Select)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Item out of stock following strict quality & artisan inspection',
                      'Logistics partner unreachable in delivery service area',
                      'Handloom artisan weaving delay; unable to fulfill in promised timeframe',
                      'Payment processing discrepancy on order checkout',
                      'Customer requested cancellation via customer care communication'
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setApologyReason(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition text-left cursor-pointer ${
                          apologyReason === preset
                            ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Custom Apology Message / Reason (Sent to Customer Email)
                  </label>
                  <textarea
                    value={apologyReason}
                    onChange={(e) => setApologyReason(e.target.value)}
                    rows={4}
                    placeholder="Type your polite explanation and apology to the customer here..."
                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-amber-400 focus:outline-none font-medium leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCancelModalOrder(null)}
                    disabled={cancellingOrder}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminCancelSubmit}
                    disabled={cancellingOrder || !apologyReason.trim()}
                    className="flex-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancellingOrder ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Cancelling & Notifying...
                      </>
                    ) : (
                      'Confirm Cancellation & Send Apology'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE ORDER CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete Order</h3>
                  <p className="text-xs text-gray-500">#{deleteTarget.orderNumber || deleteTarget.id.substring(0,8)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed">
                Choose how to delete this order ({formatCurrency(deleteTarget.totalAmount)}):
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(false)}
                  disabled={deletingOrder}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {deletingOrder ? 'Removing...' : 'Hide from Admin Panel (Soft Remove)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(true)}
                  disabled={deletingOrder}
                  className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                >
                  {deletingOrder ? 'Deleting...' : 'Permanent Delete from Database'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deletingOrder}
                  className="w-full py-2 rounded-xl text-gray-500 text-xs font-semibold hover:bg-gray-100 transition mt-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
