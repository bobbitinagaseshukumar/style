const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  StyleVerse Enterprise Server running on port ${PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  server.close(() => process.exit(1));
});
