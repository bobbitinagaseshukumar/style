const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

let prisma;

function initPrisma() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  } catch (err) {
    console.log('⚡ Forcing fresh Prisma Client generation for PostgreSQL...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
    } catch (genErr) {
      console.error('Prisma generation error:', genErr);
      throw genErr;
    }
  }
}

// Ensure Prisma Client is generated for PostgreSQL
try {
  prisma = initPrisma();
} catch (e) {
  // If cached client mismatch, force generate
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    prisma = new PrismaClient();
  } catch (err) {
    console.error('Failed to initialize Prisma:', err);
  }
}

module.exports = prisma;
