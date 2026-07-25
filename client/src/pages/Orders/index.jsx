import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiPrinter, FiRotateCcw } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

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
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled. Inventory stock restored!');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: 'CANCELLED' } : o));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => o.orderStatus === filterStatus);

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">Order Tracking & History</h1>
          <p className="text-xs text-gray-500 mt-1">Track delivery status timeline and manage past purchases</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {['ALL', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-charcoal-900 text-gold-400 shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
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

                      {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3 py-1.5 rounded-full border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                        >
                          <FiXCircle /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ORDER TIMELINE PROGRESS BAR */}
                  {order.orderStatus !== 'CANCELLED' && (
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
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="p-4 flex gap-4 items-center">
                        <img
                          src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                          alt=""
                          className="w-14 h-18 object-cover rounded-xl shrink-0 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-charcoal-900 truncate">{item.product?.name || 'StyleVerse Item'}</h4>
                          <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-charcoal-900">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
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
