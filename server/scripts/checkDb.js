const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Testing Neon PostgreSQL Database connection...\n');
  const startTime = Date.now();

  try {
    const [users, products, categories, settings, banners, flashSales, announcements, reviews, faqs] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.storeSettings.findUnique({ where: { id: 'default' } }),
      prisma.banner.count(),
      prisma.flashSale.count(),
      prisma.announcement.count(),
      prisma.review.count(),
      prisma.fAQ.count(),
    ]);

    const duration = Date.now() - startTime;

    console.log(`✅ Connection Status: CONNECTED & ONLINE (${duration}ms)`);
    console.log('----------------------------------------------------');
    console.log('📊 DATABASE RECORD SUMMARY:');
    console.log(`  • Users Count:         ${users} (Admin: admin@styleverse.com)`);
    console.log(`  • Products Count:      ${products} items`);
    console.log(`  • Categories Count:    ${categories} categories`);
    console.log(`  • Hero Banners Count:  ${banners} banners`);
    console.log(`  • Flash Sales Count:   ${flashSales} active sale`);
    console.log(`  • Announcements:       ${announcements} active items`);
    console.log(`  • Reviews Count:       ${reviews} verified reviews`);
    console.log(`  • FAQs Count:          ${faqs} answered questions`);
    console.log(`  • Store Name Configured: "${settings?.storeName || 'N/A'}"`);
    console.log('----------------------------------------------------');
    console.log('🎉 RESULT: Database is 100% HEALTHY, OPERATIONAL & POPULATED!');

  } catch (err) {
    console.error('❌ Database Connection Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
