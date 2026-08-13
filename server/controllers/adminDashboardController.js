const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== GET REAL-TIME DASHBOARD METRICS ====================
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Parallel Database Queries for Maximum Performance
  const [
    allOrders,
    orderCountsByStatus,
    allProducts,
    allUsers,
    recentOrders,
    recentLogs,
    reviewsCount,
    activeAnnouncements
  ] = await Promise.all([
    // All Orders for Revenue calculation
    prisma.order.findMany({
      select: {
        id: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true
      }
    }),

    // Order status counts
    prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { id: true }
    }),

    // All products count & status breakdown
    prisma.product.findMany({
      select: {
        id: true,
        status: true,
        stock: true,
        featured: true,
        trending: true,
        showOnHomepage: true
      }
    }),

    // User counts
    prisma.user.findMany({
      select: {
        id: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    }),

    // Recent 10 Orders with customer & item details
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        items: {
          take: 1,
          include: { product: { select: { id: true, name: true, images: { take: 1 } } } }
        }
      }
    }),

    // Recent 10 Activity Logs
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true } } }
    }),

    // Reviews count
    prisma.review.count(),

    // Active Website Announcements
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Calculate Revenue Metrics (Only valid customer orders count towards revenue)
  const validOrders = allOrders.filter(o =>
    o.orderStatus !== 'CANCELLED' &&
    o.orderStatus !== 'REFUNDED' &&
    o.orderStatus !== 'REJECTED' &&
    (o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED' || o.paymentMethod === 'COD')
  );

  const lifetimeRevenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const todayRevenue = validOrders.filter(o => o.createdAt >= startOfToday).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const yesterdayRevenue = validOrders.filter(o => o.createdAt >= startOfYesterday && o.createdAt <= endOfYesterday).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const weeklyRevenue = validOrders.filter(o => o.createdAt >= startOfWeek).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const monthlyRevenue = validOrders.filter(o => o.createdAt >= startOfMonth).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const yearlyRevenue = validOrders.filter(o => o.createdAt >= startOfYear).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // Revenue Growth % Calculation (Today vs Yesterday)
  let revenueGrowth = '0.0%';
  if (yesterdayRevenue > 0) {
    const growthVal = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    revenueGrowth = `${growthVal >= 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
  } else if (todayRevenue > 0) {
    revenueGrowth = '+100.0%';
  }

  // Order Status Map
  const statusMap = {};
  orderCountsByStatus.forEach(item => {
    statusMap[item.orderStatus] = item._count.id;
  });

  const totalOrdersCount = allOrders.length;
  const pendingOrdersCount = statusMap['PENDING'] || 0;
  const confirmedOrdersCount = statusMap['CONFIRMED'] || 0;
  const packedOrdersCount = statusMap['PACKED'] || 0;
  const shippedOrdersCount = statusMap['SHIPPED'] || 0;
  const deliveredOrdersCount = statusMap['DELIVERED'] || 0;
  const cancelledOrdersCount = statusMap['CANCELLED'] || 0;
  const refundedOrdersCount = statusMap['REFUNDED'] || 0;

  const pendingApprovalCount = statusMap['PENDING_APPROVAL'] || 0;

  // Product Status Breakdown
  const totalProductsCount = allProducts.length;
  const publishedProductsCount = allProducts.filter(p => (p.status || 'PUBLISHED') === 'PUBLISHED').length;
  const draftProductsCount = allProducts.filter(p => p.status === 'DRAFT').length;
  const hiddenProductsCount = allProducts.filter(p => p.status === 'HIDDEN').length;
  const archivedProductsCount = allProducts.filter(p => p.status === 'ARCHIVED').length;
  const outOfStockCount = allProducts.filter(p => p.stock === 0).length;
  const featuredProductsCount = allProducts.filter(p => p.featured).length;

  // Customer Breakdown — tallies exactly with Customer Management total registered accounts
  const totalCustomersCount = allUsers.length;
  const customers = allUsers.filter(u => !['ADMIN', 'SUPER_ADMIN'].includes((u.role || '').toUpperCase()));
  const newCustomersToday = allUsers.filter(u => u.createdAt >= startOfToday).length;
  const verifiedCustomers = allUsers.filter(u => u.isVerified).length;

  // Dynamic Monthly Chart Data (Jan - Dec 2026)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueChart = new Array(12).fill(0);
  const monthlyOrdersChart = new Array(12).fill(0);

  validOrders.forEach(o => {
    const oDate = new Date(o.createdAt);
    if (oDate.getFullYear() === now.getFullYear()) {
      const monthIdx = oDate.getMonth();
      monthlyRevenueChart[monthIdx] += Number(o.totalAmount || 0);
      monthlyOrdersChart[monthIdx] += 1;
    }
  });

  // Top Selling Products Aggregation
  let topSellingProducts = [];
  try {
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    if (topItems.length > 0) {
      const productIds = topItems.map(i => i.productId);
      const prodDetails = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: { take: 1 } }
      });

      topSellingProducts = topItems.map(item => {
        const prod = prodDetails.find(p => p.id === item.productId);
        return {
          id: item.productId,
          name: prod?.name || 'Product',
          image: prod?.images?.[0]?.url || null,
          unitsSold: item._sum.quantity || 0,
          totalRevenue: item._sum.price || 0,
          stock: prod?.stock || 0
        };
      });
    }
  } catch (err) {
    console.log('Top selling calculation error:', err.message);
  }

  res.status(200).json({
    success: true,
    message: 'Real-time dashboard metrics fetched',
    data: {
      revenue: {
        lifetime: lifetimeRevenue,
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        weekly: weeklyRevenue,
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
        growth: revenueGrowth
      },
      orders: {
        total: totalOrdersCount,
        pending: pendingOrdersCount,
        pendingApproval: pendingApprovalCount,
        confirmed: confirmedOrdersCount,
        packed: packedOrdersCount,
        shipped: shippedOrdersCount,
        delivered: deliveredOrdersCount,
        cancelled: cancelledOrdersCount,
        refunded: refundedOrdersCount
      },
      products: {
        total: totalProductsCount,
        published: publishedProductsCount,
        draft: draftProductsCount,
        hidden: hiddenProductsCount,
        archived: archivedProductsCount,
        outOfStock: outOfStockCount,
        featured: featuredProductsCount
      },
      customers: {
        total: totalCustomersCount,
        newToday: newCustomersToday,
        verified: verifiedCustomers
      },
      counts: {
        reviews: reviewsCount,
        announcements: activeAnnouncements.length
      },
      chart: {
        months,
        revenueData: monthlyRevenueChart,
        ordersData: monthlyOrdersChart
      },
      recentOrders,
      topSellingProducts,
      recentLogs,
      activeAnnouncements
    }
  });
});
