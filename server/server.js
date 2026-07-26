const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

const { bootstrapSuperAdmin } = require('./controllers/adminAuthController');

const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  StyleVerse Enterprise Server running on port ${PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
  await bootstrapSuperAdmin();
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  server.close(() => process.exit(1));
});
