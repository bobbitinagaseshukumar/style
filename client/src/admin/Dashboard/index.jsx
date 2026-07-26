import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiDollarSign, FiShoppingBag, FiBox, FiUsers, FiTrendingUp,
  FiArrowUpRight, FiArrowDownRight, FiEye, FiPackage, FiClock,
  FiTrash2, FiPlus, FiRefreshCw, FiZap, FiTag, FiCheckCircle,
  FiAlertTriangle, FiCheck, FiX, FiFilter, FiDownload, FiActivity,
  FiBarChart2, FiCalendar, FiBell, FiShield, FiSend, FiFileText
} from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const Dashboard = () => {
  // 100% REAL-TIME ZERO-BASE DEFAULT STATS
  const [data, setData] = useState({
    revenue: { lifetime: 0, today: 0, yesterday: 0, weekly: 0, monthly: 0, yearly: 0, growth: '0.0%' },
    orders: { total: 0, pending: 0, confirmed: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0 },
    products: { total: 0, published: 0, draft: 0, hidden: 0, archived: 0, outOfStock: 0, featured: 0 },
    customers: { total: 0, newToday: 0, verified: 0 },
    counts: { reviews: 0, announcements: 0 },
    chart: { months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], revenueData: new Array(12).fill(0), ordersData: new Array(12).fill(0) },
    recentOrders: [],
    topSellingProducts: [],
    recentLogs: [],
    activeAnnouncements: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'
  const [activeChartTab, setActiveChartTab] = useState('revenue'); // 'revenue' | 'orders'

  // Modals & Controls
  const [deleteOrderTarget, setDeleteOrderTarget] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });

  // FETCH REAL-TIME STATS FROM BACKEND DATABASE
  const fetchStats = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get('/admin/dashboard/stats');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.log('Real-time stats fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => fetchStats(), 15000); // Live poll every 15 seconds
    }
    return () => clearInterval(interval);
  }, [fetchStats, autoRefresh]);

  // DELETE ORDER HANDLER
  const handleDeleteOrderSubmit = async (hardDelete = false) => {
    if (!deleteOrderTarget) return;
    try {
      setDeletingOrder(true);
      await api.delete(`/orders/${deleteOrderTarget.id}${hardDelete ? '?hardDelete=true' : ''}`);
      toast.success(`Order #${deleteOrderTarget.id} removed from database`);
      setDeleteOrderTarget(null);
      fetchStats(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(false);
    }
  };

  // EXPORT SALES REPORT TO CSV
  const handleExportCSV = () => {
    if (!data.recentOrders || data.recentOrders.length === 0) {
      toast.info('No order transactions recorded yet to export.');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Amount (INR)', 'Payment Status', 'Order Status', 'Date'];
    const rows = data.recentOrders.map(o => [
      o.id,
      `"${o.user?.fullName || 'Guest'}"`,
      `"${o.user?.email || 'N/A'}"`,
      o.totalAmount || 0,
      o.paymentStatus || 'PENDING',
      o.orderStatus || 'PENDING',
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StyleVerse_Sales_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report CSV exported successfully!');
  };

  // CREATE ANNOUNCEMENT HANDLER
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/announcements', annForm);
      toast.success('Website Announcement published live!');
      setShowAnnModal(false);
      setAnnForm({ title: '', message: '', link: '', textColor: '#FFFFFF', backgroundColor: '#D4AF37' });
      fetchStats(true);
    } catch (err) {
      toast.error('Failed to publish announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/cms/announcements/${id}`);
      toast.success('Announcement removed');
      fetchStats(true);
    } catch (err) {
      toast.error('Failed to remove announcement');
    }
  };

  // Date Filtering on Recent Orders
  const filteredRecentOrders = (data.recentOrders || []).filter(o => {
    if (dateFilter === 'ALL') return true;
    const oDate = new Date(o.createdAt);
    const now = new Date();
    if (dateFilter === 'TODAY') return oDate.toDateString() === now.toDateString();
    if (dateFilter === 'WEEK') return now.getTime() - oDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === 'MONTH') return now.getTime() - oDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">

      {/* Top Banner & Real-Time Sync Controller */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal-950 via-charcoal-900 to-amber-950 p-6 lg:p-8 text-white shadow-2xl border border-amber-500/20"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gold-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefresh ? 'bg-emerald-400' : 'bg-gray-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoRefresh ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300">
                {autoRefresh ? 'REAL-TIME DB SYNC ACTIVE (15s Poll)' : 'MANUAL REFRESH MODE'}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white leading-tight">
              Real-Time Admin Operations
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
              Live statistics dynamically calculated from Neon PostgreSQL database. Zero hardcoded metrics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchStats(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold backdrop-blur-md transition-all cursor-pointer border border-white/10 shadow-sm"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Now
            </button>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
              }`}
            >
              {autoRefresh ? '🟢 Auto-Sync ON' : '⚪ Auto-Sync OFF'}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <FiDownload size={14} /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* 1. REVENUE METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { title: "Today's Revenue", value: formatCurrency(data.revenue.today), sub: `Yesterday: ${formatCurrency(data.revenue.yesterday)}`, change: data.revenue.growth, icon: FiDollarSign, gradient: 'from-emerald-500 to-teal-600' },
          { title: 'Weekly Revenue (7 Days)', value: formatCurrency(data.revenue.weekly), sub: 'Last 7 days total', change: 'Live', icon: FiTrendingUp, gradient: 'from-blue-500 to-indigo-600' },
          { title: 'Monthly Revenue (30 Days)', value: formatCurrency(data.revenue.monthly), sub: 'Current month total', change: 'Live', icon: FiBarChart2, gradient: 'from-purple-500 to-violet-600' },
          { title: 'Lifetime Revenue', value: formatCurrency(data.revenue.lifetime), sub: `Yearly: ${formatCurrency(data.revenue.yearly)}`, change: 'Total', icon: FiZap, gradient: 'from-amber-500 to-orange-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={fadeInUp}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FiArrowUpRight className="w-3 h-3" />
                  {card.change}
                </span>
              </div>
              <h3 className="text-2xl font-black text-charcoal-900">{card.value}</h3>
              <p className="text-xs font-semibold text-gray-800 mt-1">{card.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 2. ORDER & CUSTOMER STATUS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Orders', count: data.orders.total, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Pending Orders', count: data.orders.pending, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Shipped / Active', count: data.orders.shipped + data.orders.packed, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { label: 'Delivered', count: data.orders.delivered, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Cancelled', count: data.orders.cancelled, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
          { label: 'Total Customers', count: data.customers.total, bg: 'bg-purple-50 text-purple-700 border-purple-200' },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeInUp} className={`p-4 rounded-2xl border text-center ${item.bg}`}>
            <p className="text-2xl font-black">{item.count}</p>
            <p className="text-[11px] font-bold mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* 3. DYNAMIC REVENUE & ORDERS CHART */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={fadeInUp} className="xl:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-charcoal-900">Real-Time Performance Chart (2026)</h2>
              <p className="text-xs text-gray-500">Live aggregate of database sales & orders by month</p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeChartTab === 'revenue' ? 'bg-amber-400 text-black shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue Trend
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeChartTab === 'orders' ? 'bg-amber-400 text-black shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Order Volume
              </button>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-2 lg:gap-3 h-48 pt-4">
            {data.chart.months.map((month, i) => {
              const val = activeChartTab === 'revenue' ? data.chart.revenueData[i] : data.chart.ordersData[i];
              const maxVal = Math.max(...(activeChartTab === 'revenue' ? data.chart.revenueData : data.chart.ordersData), 1);
              const heightPercent = Math.max((val / maxVal) * 100, 4);

              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeChartTab === 'revenue' ? `₹${(val / 1000).toFixed(0)}k` : val}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg transition-all ${
                      val > 0
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md group-hover:from-amber-400 group-hover:to-yellow-300'
                        : 'bg-gray-100'
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-gray-500">{month}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* TOP SELLING PRODUCTS */}
        <motion.div variants={fadeInUp} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900">Top Selling Products</h2>
            <span className="text-xs font-semibold text-gray-400">Database Live</span>
          </div>

          {(!data.topSellingProducts || data.topSellingProducts.length === 0) ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No product sales recorded yet in database.
            </div>
          ) : (
            <div className="space-y-3">
              {data.topSellingProducts.map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition border border-gray-100">
                  <img src={prod.image || 'https://placehold.co/40x40?text=PROD'} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                    <p className="text-[10px] text-gray-400">{prod.unitsSold} units sold • Stock: {prod.stock}</p>
                  </div>
                  <span className="text-xs font-bold text-charcoal-900">{formatCurrency(prod.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 4. RECENT ORDERS TABLE WITH DIRECT DELETE & STATUS EDIT */}
      <motion.div variants={fadeInUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">Recent Customer Transactions</h2>
            <p className="text-xs text-gray-500">Live order records directly from Neon PostgreSQL database</p>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" size={14} />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">All Date Ranges</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>

        {filteredRecentOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs">
            No recent customer orders found in database for selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase hidden md:table-cell">Product</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecentOrders.map((order) => {
                  const prodItem = order.items?.[0]?.product;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 text-xs font-bold font-mono text-charcoal-900">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-800 font-semibold">
                        {order.user?.fullName || 'Guest Customer'}
                        <p className="text-[10px] text-gray-400 font-normal">{order.user?.email || 'No Email'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 hidden md:table-cell truncate max-w-[180px]">
                        {prodItem?.name || 'Store Order'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-charcoal-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          order.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.orderStatus === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.orderStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to="/admin/orders"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            title="View Full Order"
                          >
                            <FiEye size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteOrderTarget(order)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Order"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* 5. WEBSITE ANNOUNCEMENTS WIDGET */}
      <motion.div variants={fadeInUp} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBell className="text-amber-500 w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold text-charcoal-900">Website Announcements System</h2>
              <p className="text-xs text-gray-500">Live banner broadcasts displayed to all site visitors</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAnnModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold shadow-sm hover:bg-amber-500 transition cursor-pointer"
          >
            <FiPlus size={14} /> Create Announcement
          </button>
        </div>

        {(!data.activeAnnouncements || data.activeAnnouncements.length === 0) ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No active website announcements. Click &quot;Create Announcement&quot; to broadcast live promo alerts!
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.activeAnnouncements.map((a) => (
              <div
                key={a.id}
                style={{ backgroundColor: a.backgroundColor || '#D4AF37', color: a.textColor || '#FFFFFF' }}
                className="p-4 rounded-2xl flex items-center justify-between shadow-sm"
              >
                <div className="text-xs font-medium">
                  <span className="font-bold mr-2">[{a.title}]</span>
                  <span>{a.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-1.5 hover:bg-black/10 rounded-lg transition cursor-pointer"
                  title="Remove Announcement"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* DELETE ORDER MODAL */}
      <AnimatePresence>
        {deleteOrderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
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
                  <p className="text-xs text-gray-500">Confirm order removal</p>
                </div>
              </div>
              <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed">
                Delete Order <strong>#{deleteOrderTarget.id.substring(0, 8)}</strong> ({formatCurrency(deleteOrderTarget.totalAmount)})?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteOrderSubmit(false)}
                  disabled={deletingOrder}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
                >
                  Cancel Order & Soft Remove
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOrderSubmit(true)}
                  disabled={deletingOrder}
                  className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                >
                  Permanent Delete from Database
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOrderTarget(null)}
                  disabled={deletingOrder}
                  className="w-full py-2 rounded-xl text-gray-500 text-xs font-semibold hover:bg-gray-100 transition mt-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {showAnnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative"
            >
              <button onClick={() => setShowAnnModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
                <FiX size={18} />
              </button>
              <h3 className="text-lg font-bold text-charcoal-900 mb-1">Create Website Announcement</h3>
              <p className="text-xs text-gray-500 mb-4">Broadcast promo alert across website header</p>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Tag Title *</label>
                  <input
                    type="text"
                    value={annForm.title}
                    onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                    placeholder="e.g. FESTIVE SALE"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Message Text *</label>
                  <input
                    type="text"
                    value={annForm.message}
                    onChange={e => setAnnForm({ ...annForm, message: e.target.value })}
                    placeholder="e.g. Get 20% OFF on all Silk Sarees!"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Background</label>
                    <input
                      type="color"
                      value={annForm.backgroundColor}
                      onChange={e => setAnnForm({ ...annForm, backgroundColor: e.target.value })}
                      className="w-full h-9 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={annForm.textColor}
                      onChange={e => setAnnForm({ ...annForm, textColor: e.target.value })}
                      className="w-full h-9 rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnnModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Publish Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Dashboard;
