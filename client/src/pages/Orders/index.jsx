import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiPrinter, FiRotateCcw } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

const CancellationTimer = ({ order, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/orders/${order.id}/cancellation-status`);
        const { timeRemainingMs } = data.data;
        if (timeRemainingMs > 0) {
          setTimeLeft(timeRemainingMs);
          interval = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1000) {
                clearInterval(interval);
                setExpired(true);
                return 0;
              }
              return prev - 1000;
            });
          }, 1000);
        } else {
          setExpired(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
    return () => clearInterval(interval);
  }, [order.id]);

  if (expired) {
    return <div className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">Cancellation window expired</div>;
  }

  if (timeLeft === null) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <>
      <div className="flex items-center gap-3 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
        <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 animate-pulse whitespace-nowrap">
          <FiClock /> {formattedTime}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline whitespace-nowrap"
        >
          Cancel Order
        </button>
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Cancel Order">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Please tell us why you're cancelling this order:</p>
            <textarea
              className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400"
              rows="3"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for cancellation..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold rounded-xl border hover:bg-gray-50 transition">Keep Order</button>
              <button
                onClick={() => {
                  onCancel(order.id, reason);
                  setShowModal(false);
                }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const orderTimelineSteps = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/my-orders');
      setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleSync = () => fetchOrders();
    window.addEventListener('orders_updated', handleSync);
    return () => window.removeEventListener('orders_updated', handleSync);
  }, []);

  const handleCancelOrder = async (orderId, reason = '') => {
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason });
      toast.success('Order cancelled. Inventory stock restored!');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: 'CANCELLED', cancellationAllowed: false } : o));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => {
        if (filterStatus === 'PENDING_APPROVAL') {
          return ['PENDING', 'PENDING_APPROVAL', 'PROCESSING'].includes(o.orderStatus);
        }
        if (filterStatus === 'CONFIRMED') {
          return ['CONFIRMED', 'PACKED'].includes(o.orderStatus);
        }
        if (filterStatus === 'SHIPPED') {
          return ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus);
        }
        if (filterStatus === 'DELIVERED') {
          return o.orderStatus === 'DELIVERED';
        }
        if (filterStatus === 'CANCELLED') {
          return ['CANCELLED', 'REJECTED'].includes(o.orderStatus);
        }
        return o.orderStatus === filterStatus;
      });

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">Order Tracking & History</h1>
          <p className="text-xs text-gray-500 mt-1">Track delivery status timeline and manage past purchases</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'PENDING_APPROVAL', label: 'PENDING' },
            { id: 'CONFIRMED', label: 'CONFIRMED' },
            { id: 'SHIPPED', label: 'SHIPPED' },
            { id: 'DELIVERED', label: 'DELIVERED' },
            { id: 'CANCELLED', label: 'CANCELLED' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filterStatus === st.id
                  ? 'bg-charcoal-900 text-gold-400 shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading order history...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100 max-w-lg mx-auto">
            No orders found under this status.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const currentStepIndex = orderTimelineSteps.indexOf(order.orderStatus);

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-base text-charcoal-900">{order.orderNumber || order.id}</strong>
                        <span className="text-xs text-gray-400 font-mono">({formatDate(order.createdAt)})</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-charcoal-900 hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <FiPrinter /> Invoice
                      </button>

                      {order.cancellationAllowed && order.cancellationEnd && new Date(order.cancellationEnd) > new Date() ? (
                        <CancellationTimer order={order} onCancel={handleCancelOrder} />
                      ) : order.orderStatus === 'PENDING_APPROVAL' ? (
                        <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                          <FiClock /> Awaiting Approval
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* BANNERS */}
                  {order.orderStatus === 'PENDING_APPROVAL' && (
                    <div className="bg-amber-50 text-amber-700 p-3.5 rounded-2xl text-xs font-semibold border border-amber-200 flex items-center gap-2">
                      <span className="text-base">⏳</span> Your order is awaiting seller approval & delivery scheduling
                    </div>
                  )}
                  {order.orderStatus === 'REJECTED' && (
                    <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold border border-rose-200 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">❌</span> Order Rejected by Seller
                      </div>
                      {order.cancellationReason && <p className="text-[11px] opacity-90 pl-6">Reason: {order.cancellationReason}</p>}
                    </div>
                  )}
                  {order.orderStatus === 'CANCELLED' && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-red-700">
                          <FiXCircle className="w-4 h-4 text-red-600" /> ORDER CANCELLED
                        </span>
                        <span className="text-[11px] text-red-500 font-mono">
                          {formatDate(order.cancelledAt || order.updatedAt)}
                        </span>
                      </div>
                      {order.cancellationReason && (
                        <p className="text-xs text-red-700 font-medium">
                          Reason: <strong>{order.cancellationReason}</strong>
                        </p>
                      )}
                      <div className="text-[11px] text-red-600 font-medium pt-1 border-t border-red-200/60">
                        💳 Refund Status: {order.paymentStatus === 'PAID' ? 'Refund Initialized / Processed to Original Payment Method' : 'COD Order (No Payment Collected)'}
                      </div>
                    </div>
                  )}

                  {order.orderStatus === 'DELIVERED' && (
                    <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-700">
                          <FiCheckCircle className="w-4 h-4 text-emerald-600" /> 🎉 ORDER DELIVERED
                        </span>
                        <span className="text-[11px] text-emerald-600 font-mono">
                          {formatDate(order.deliveredAt || order.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-medium">
                        Your items have been safely delivered to your address. Thank you for shopping with StyleVerse!
                      </p>
                    </div>
                  )}

                  {/* ADMIN SCHEDULED DELIVERY & TRACKING INFO */}
                  {(order.packingDate || order.shippingDate || order.deliveryDate || order.expectedDeliveryDate || order.courierName || order.trackingNumber) && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-charcoal-900">
                      <p className="font-bold text-[11px] text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FiTruck className="w-4 h-4 text-amber-600" /> Delivery & Timeline Schedule (Set by Admin)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {order.packingDate && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            📦 Packing Date & Time: <strong>{order.packingDate}</strong>
                          </div>
                        )}
                        {order.shippingDate && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            🚚 Shipping Date & Time: <strong>{order.shippingDate}</strong>
                          </div>
                        )}
                        {(order.deliveryDate || order.expectedDeliveryDate) && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            📅 Expected Delivery Date: <strong>{order.deliveryDate || order.expectedDeliveryDate}</strong>
                          </div>
                        )}
                        {(order.deliveryTime || order.deliveryTimeSlot) && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            ⏰ Delivery Time Slot: <strong>{order.deliveryTime || order.deliveryTimeSlot}</strong>
                          </div>
                        )}
                        {order.courierName && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            🏢 Courier: <strong>{order.courierName}</strong>
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                            🔢 Tracking ID: <strong className="font-mono">{order.trackingNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ORDER TIMELINE PROGRESS BAR */}
                  {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REJECTED' && (
                    <div className="py-2">
                      <div className="flex justify-between items-center relative max-w-2xl mx-auto">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
                        <div
                          className="absolute top-1/2 left-0 h-1 bg-gold-500 -translate-y-1/2 z-0 transition-all duration-500"
                          style={{
                            width: `${Math.max(0, (currentStepIndex / (orderTimelineSteps.length - 1)) * 100)}%`,
                          }}
                        />

                        {orderTimelineSteps.map((step, idx) => {
                          const isDone = currentStepIndex >= idx;
                          return (
                            <div key={step} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-gold-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-400 border border-gray-300'
                                }`}
                              >
                                {isDone ? <FiCheckCircle className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] font-semibold mt-2 ${isDone ? 'text-charcoal-900' : 'text-gray-400'}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ITEMS LIST */}
                  <div className="divide-y divide-gray-100 border rounded-2xl overflow-hidden bg-gray-50/50">
                    {order.items?.map((item, idx) => {
                      const itemName = item.productName || item.product?.name || 'Ordered Product';
                      const itemImg = item.productImage || item.product?.images?.find(i => i.isPrimary)?.url || item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400';
                      return (
                        <div key={idx} className="p-4 flex gap-4 items-center">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-14 h-18 object-cover rounded-xl shrink-0 bg-white border border-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-charcoal-900 truncate">{itemName}</h4>
                            <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-charcoal-900">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM TOTAL */}
                  <div className="flex justify-between items-center text-xs text-gray-600 pt-2">
                    <span>Delivering to: <strong className="text-charcoal-900">{order.address?.city || 'India'}</strong></span>
                    <span className="text-sm font-bold text-charcoal-900">Total: {formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Customer Invoice - ${selectedInvoice.orderNumber || selectedInvoice.id}`}>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-gold-600">StyleVerse Retail Ltd.</h3>
                <p className="text-gray-500">GSTIN: 36AAACS1234F1Z9</p>
                <p className="text-gray-500">Invoice: {selectedInvoice.orderNumber || selectedInvoice.id}</p>
              </div>
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-charcoal-900 text-white rounded-lg font-semibold flex items-center gap-1">
                <FiPrinter /> Print PDF
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="block text-gray-800">Billed To:</strong>
                <p>{selectedInvoice.address?.fullName || selectedInvoice.user?.fullName}</p>
                <p>{selectedInvoice.address?.street}</p>
                <p>{selectedInvoice.address?.city}, {selectedInvoice.address?.state}</p>
              </div>
              <div className="text-right">
                <p>Date: {formatDate(selectedInvoice.createdAt)}</p>
                <p>Payment: {selectedInvoice.paymentMethod}</p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="hidden sm:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Product Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2">{it.product?.name || 'Item'}</td>
                        <td className="p-2 text-right">{it.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="sm:hidden flex flex-col divide-y">
                {selectedInvoice.items?.map((it, i) => (
                  <div key={i} className="p-3 flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{it.product?.name || 'Item'}</p>
                      <p className="text-gray-500">Qty: {it.quantity}</p>
                    </div>
                    <div className="font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right font-bold text-sm text-charcoal-900 pt-2 border-t">
              Grand Total: {formatCurrency(selectedInvoice.totalAmount)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
