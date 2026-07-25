const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

let prisma;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
} catch (err) {
  console.log('⚡ Self-healing: Auto-generating Prisma Client binaries...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  } catch (genErr) {
    console.error('Prisma generation error:', genErr);
    throw genErr;
  }
}

module.exports = prisma;
