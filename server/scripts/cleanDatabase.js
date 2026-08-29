const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting KVLR Styles Database Cleanup...\n');
  console.log('⚠️  This will DELETE: products, subcategories, customers, orders, reviews, carts, wishlists');
  console.log('✅  This will KEEP: main categories\n');

  try {
    // ── 1. Delete Order Items & Orders ──
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`🗑️  Deleted ${deletedOrderItems.count} order items`);

    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`🗑️  Deleted ${deletedOrders.count} orders`);

    // ── 2. Delete Reviews ──
    const deletedReviews = await prisma.review.deleteMany({});
    console.log(`🗑️  Deleted ${deletedReviews.count} reviews`);

    // ── 3. Delete Wishlists & Wishlist Items ──
    const deletedWishlistItems = await prisma.wishlistItem.deleteMany({});
    console.log(`🗑️  Deleted ${deletedWishlistItems.count} wishlist items`);

    const deletedWishlists = await prisma.wishlist.deleteMany({});
    console.log(`🗑️  Deleted ${deletedWishlists.count} wishlists`);

    // ── 4. Delete Carts & Cart Items ──
    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCartItems.count} cart items`);

    const deletedCarts = await prisma.cart.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCarts.count} carts`);

    // ── 5. Delete Recently Viewed ──
    const deletedRecentlyViewed = await prisma.recentlyViewed.deleteMany({});
    console.log(`🗑️  Deleted ${deletedRecentlyViewed.count} recently viewed records`);

    // ── 6. Delete Back In Stock Subscriptions ──
    const deletedStockAlerts = await prisma.backInStockSubscription.deleteMany({});
    console.log(`🗑️  Deleted ${deletedStockAlerts.count} back-in-stock subscriptions`);

    // ── 7. Delete Product Images ──
    const deletedImages = await prisma.productImage.deleteMany({});
    console.log(`🗑️  Deleted ${deletedImages.count} product images`);

    // ── 8. Delete All Products ──
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`🗑️  Deleted ${deletedProducts.count} products`);

    // ── 9. Delete All Subcategories ──
    const deletedSubcategories = await prisma.subCategory.deleteMany({});
    console.log(`🗑️  Deleted ${deletedSubcategories.count} subcategories`);

    // ── 10. Delete Support Tickets ──
    try {
      const deletedTickets = await prisma.supportTicket.deleteMany({});
      console.log(`🗑️  Deleted ${deletedTickets.count} support tickets`);
    } catch (e) {
      console.log('ℹ️  No support tickets table or already empty');
    }

    // ── 11. Delete Notifications ──
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`🗑️  Deleted ${deletedNotifications.count} notifications`);

    // ── 12. Delete User Sessions ──
    const deletedSessions = await prisma.userSession.deleteMany({});
    console.log(`🗑️  Deleted ${deletedSessions.count} user sessions`);

    // ── 13. Delete Admin Login History ──
    const deletedLoginHistory = await prisma.adminLoginHistory.deleteMany({});
    console.log(`🗑️  Deleted ${deletedLoginHistory.count} admin login history records`);

    // ── 14. Delete Trusted Devices ──
    const deletedDevices = await prisma.adminTrustedDevice.deleteMany({});
    console.log(`🗑️  Deleted ${deletedDevices.count} trusted devices`);

    // ── 15. Delete Email OTPs ──
    const deletedOTPs = await prisma.emailOTP.deleteMany({});
    console.log(`🗑️  Deleted ${deletedOTPs.count} email OTPs`);

    // ── 16. Delete Activity Logs ──
    try {
      const deletedLogs = await prisma.activityLog.deleteMany({});
      console.log(`🗑️  Deleted ${deletedLogs.count} activity logs`);
    } catch (e) {
      console.log('ℹ️  No activity logs table or already empty');
    }

    // ── 17. Delete Admin Action Logs ──
    try {
      const deletedActionLogs = await prisma.adminActionLog.deleteMany({});
      console.log(`🗑️  Deleted ${deletedActionLogs.count} admin action logs`);
    } catch (e) {
      console.log('ℹ️  No admin action logs table or already empty');
    }

    // ── 18. Delete Search Logs ──
    const deletedSearchLogs = await prisma.searchLog.deleteMany({});
    console.log(`🗑️  Deleted ${deletedSearchLogs.count} search logs`);

    // ── 19. Delete Contact Messages ──
    const deletedContactMessages = await prisma.contactMessage.deleteMany({});
    console.log(`🗑️  Deleted ${deletedContactMessages.count} contact messages`);

    // ── 20. Delete Addresses ──
    const deletedAddresses = await prisma.address.deleteMany({});
    console.log(`🗑️  Deleted ${deletedAddresses.count} addresses`);

    // ── 21. Delete Backup History ──
    const deletedBackups = await prisma.backupHistory.deleteMany({});
    console.log(`🗑️  Deleted ${deletedBackups.count} backup history records`);

    // ── 22. Delete All Non-Admin Users (Customers) ──
    const deletedCustomers = await prisma.user.deleteMany({
      where: {
        role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });
    console.log(`🗑️  Deleted ${deletedCustomers.count} customer accounts`);

    // ── 23. Delete old admin users and recreate with new credentials ──
    await prisma.user.deleteMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });
    console.log('🗑️  Deleted old admin accounts');

    // ── 24. Create new Super Admin ──
    const hashedPassword = await bcrypt.hash('styleverse@2409', 12);
    const admin = await prisma.user.create({
      data: {
        fullName: 'KVLR Styles Admin',
        username: 'kvlradmin',
        email: 'styleverseshope@gmail.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        adminRole: 'SUPER_ADMIN',
        isVerified: true,
        status: 'ACTIVE',
        canLogin: true,
        twoFactorEnabled: true,
        adminPermissions: JSON.stringify({
          canManageProducts: true,
          canManageOrders: true,
          canManageCustomers: true,
          canManageCoupons: true,
          canManageCMS: true,
          canManageAdmins: true,
          canManageSettings: true,
        }),
      },
    });
    console.log(`\n✅ New Super Admin created:`);
    console.log(`   Email: styleverseshope@gmail.com`);
    console.log(`   Password: styleverse@2409`);
    console.log(`   User ID: ${admin.id}`);

    // ── 25. Verify categories are preserved ──
    const remainingCategories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true }
    });
    console.log(`\n✅ ${remainingCategories.length} Categories PRESERVED:`);
    remainingCategories.forEach(cat => {
      console.log(`   • ${cat.name} (${cat.slug})`);
    });

    console.log('\n🎉 Database cleanup complete! Only categories remain.');
    console.log('🔐 Login with: styleverseshope@gmail.com / styleverse@2409');

  } catch (error) {
    console.error('\n❌ Cleanup error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
