import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiDollarSign, FiShoppingBag, FiBox, FiUsers, FiTrendingUp,
  FiArrowUpRight, FiArrowDownRight, FiEye, FiPackage, FiClock
} from 'react-icons/fi';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// Demo data for UI preview
const statsCards = [
  { title: 'Total Revenue', value: '₹12,48,950', change: '+18.2%', up: true, icon: FiDollarSign, gradient: 'from-emerald-500 to-teal-600' },
  { title: 'Total Orders', value: '1,284', change: '+12.5%', up: true, icon: FiShoppingBag, gradient: 'from-blue-500 to-indigo-600' },
  { title: 'Total Products', value: '386', change: '+24', up: true, icon: FiBox, gradient: 'from-purple-500 to-violet-600' },
  { title: 'Total Customers', value: '2,847', change: '+8.1%', up: true, icon: FiUsers, gradient: 'from-amber-500 to-orange-600' },
];

const recentOrders = [
  { id: 'SV-10284', customer: 'Priya Sharma', product: 'Silk Banarasi Saree', amount: '₹4,599', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'SV-10283', customer: 'Anita Reddy', product: 'Gold Plated Necklace Set', amount: '₹2,199', status: 'Shipped', statusColor: 'bg-blue-100 text-blue-700' },
  { id: 'SV-10282', customer: 'Rajesh Kumar', product: 'Men\'s Cotton Shirt', amount: '₹899', status: 'Processing', statusColor: 'bg-amber-100 text-amber-700' },
  { id: 'SV-10281', customer: 'Meena Devi', product: 'Cotton Kurti Set', amount: '₹1,299', status: 'Pending', statusColor: 'bg-gray-100 text-gray-700' },
  { id: 'SV-10280', customer: 'Kavitha N.', product: 'Kundan Bridal Set', amount: '₹8,499', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'SV-10279', customer: 'Deepak Jain', product: 'Boys Denim Jeans', amount: '₹649', status: 'Shipped', statusColor: 'bg-blue-100 text-blue-700' },
];

const topProducts = [
  { name: 'Silk Banarasi Saree - Royal Blue', sales: 142, revenue: '₹6,53,058', image: '🥻' },
  { name: 'Kundan Bridal Necklace Set', sales: 98, revenue: '₹8,32,902', image: '💎' },
  { name: 'Cotton Kurti - Block Print', sales: 234, revenue: '₹3,04,200', image: '👗' },
  { name: 'Gold Plated Temple Earrings', sales: 187, revenue: '₹1,68,300', image: '✨' },
  { name: 'Designer Lehenga Choli', sales: 67, revenue: '₹5,02,500', image: '👘' },
];

const quickActions = [
  { label: 'Add Product', path: '/admin/products', icon: FiBox, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { label: 'View Orders', path: '/admin/orders', icon: FiPackage, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  { label: 'Manage Banners', path: '/admin/banners', icon: FiEye, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
  { label: 'Store Settings', path: '/admin/settings', icon: FiClock, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
];

// Mini bar chart using pure CSS
const revenueData = [35, 55, 42, 68, 45, 72, 58, 80, 65, 90, 78, 95];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 p-6 lg:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-serif font-bold mb-2">
            Welcome back, <span className="text-gold-400">Admin</span> 👋
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">
            Here&apos;s what&apos;s happening with your store today. You have <span className="text-gold-400 font-semibold">12 new orders</span> and <span className="text-gold-400 font-semibold">5 pending reviews</span>.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {card.up ? <FiArrowUpRight className="w-3 h-3" /> : <FiArrowDownRight className="w-3 h-3" />}
                  {card.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">{card.value}</h3>
              <p className="text-sm text-gray-500 mt-1">{card.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <h2 className="text-lg font-semibold text-charcoal-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${action.color}`}
              >
                <Icon className="w-5 h-5" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={fadeInUp} className="xl:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-charcoal-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Monthly revenue for 2026</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <FiTrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+24.5%</span>
            </div>
          </div>
          {/* CSS Bar Chart */}
          <div className="flex items-end gap-2 lg:gap-3 h-48">
            {revenueData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg ${
                    i === 11 ? 'bg-gradient-to-t from-gold-500 to-gold-400' :
                    i >= 9 ? 'bg-gradient-to-t from-gold-500/60 to-gold-400/40' :
                    'bg-gradient-to-t from-gray-200 to-gray-100'
                  }`}
                />
                <span className="text-[10px] text-gray-400 font-medium">{months[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 group-hover:scale-110 transition-transform">
                  {product.image}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sold</p>
                </div>
                <span className="text-sm font-semibold text-charcoal-900 whitespace-nowrap">{product.revenue}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-900">Recent Orders</h2>
            <p className="text-sm text-gray-500">Latest transactions from your store</p>
          </div>
          <Link to="/admin/orders" className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1">
            View All <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-charcoal-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell truncate max-w-[200px]">{order.product}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-charcoal-900">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
