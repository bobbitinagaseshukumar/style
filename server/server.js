const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

const { bootstrapSuperAdmin } = require('./controllers/adminAuthController');
const prisma = require('./config/db');

const autoPublishVisibleProducts = async () => {
  try {
    const result = await prisma.product.updateMany({
      where: {
        OR: [
          { status: 'published' },
          { status: 'DRAFT' },
          { status: 'draft' },
          { status: 'hidden' },
          { status: null },
        ],
        isVisible: true,
      },
      data: {
        status: 'PUBLISHED',
      },
    });
    if (result.count > 0) {
      console.log(`[AUTO-PUBLISH] Migrated ${result.count} product(s) to PUBLISHED status.`);
    }
  } catch (err) {
    console.error('[AUTO-PUBLISH ERROR]:', err.message);
  }
};

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  StyleVerse Enterprise Server running on port ${PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
  await bootstrapSuperAdmin();
  await autoPublishVisibleProducts();
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  server.close(() => process.exit(1));
});
