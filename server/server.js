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

const startKeepAliveEngine = () => {
  const PING_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes

  setInterval(async () => {
    try {
      // 1. Keep Neon DB connection pool active
      await prisma.$queryRaw`SELECT 1`;
      console.log(`[KEEP-ALIVE] DB pool touch successful at ${new Date().toISOString()}`);

      // 2. Self-ping Render web service to prevent idle spin-down
      const backendUrl = process.env.RENDER_EXTERNAL_URL || 'https://style-q21b.onrender.com';
      if (backendUrl && !backendUrl.includes('localhost')) {
        const https = require('https');
        https.get(`${backendUrl}/api/v1/health`, (res) => {
          res.on('data', () => {}); // Consume stream
        }).on('error', (e) => {
          console.warn('[KEEP-ALIVE] Health ping warn:', e.message);
        });
      }
    } catch (err) {
      console.warn('[KEEP-ALIVE ERROR]:', err.message);
    }
  }, PING_INTERVAL_MS);
};

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  StyleVerse Enterprise Server running on port ${PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
  await bootstrapSuperAdmin();
  await autoPublishVisibleProducts();
  startKeepAliveEngine();
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  server.close(() => process.exit(1));
});
