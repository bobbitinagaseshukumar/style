const prisma = require('../config/db');

exports.getHealthStatus = async (req, res) => {
  try {
    // Check DB Connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'CONNECTED';

    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      message: 'StyleVerse Enterprise Production API operational',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      nodeVersion: process.version,
      memoryUsage: {
        rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
    });
  }
};
