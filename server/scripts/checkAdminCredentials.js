const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAdminCredentials() {
  const email = 'nagaseshukumarbobbiti@gmail.com';
  const password = 'seshu@2409';

  console.log(`🔍 Checking user in Neon DB for: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    console.log('❌ User NOT found in database!');
    return;
  }

  console.log('✅ User found:');
  console.log(`  • ID: ${user.id}`);
  console.log(`  • Full Name: ${user.fullName}`);
  console.log(`  • Email: ${user.email}`);
  console.log(`  • Role: ${user.role}`);
  console.log(`  • IsVerified: ${user.isVerified}`);
  console.log(`  • Status: ${user.status}`);

  const match = await bcrypt.compare(password, user.password);
  console.log(`🔑 Password Match Result: ${match ? 'MATCHES ✅' : 'DOES NOT MATCH ❌'}`);

  // Re-hash and force update to ensure 100% validity
  const newHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      password: newHash,
      role: 'SUPER_ADMIN',
      isVerified: true,
      status: 'ACTIVE'
    }
  });

  console.log('🚀 Password hash refreshed & user status set to ACTIVE & Verified!');
}

checkAdminCredentials()
  .catch(err => console.error('Error:', err))
  .finally(() => prisma.$disconnect());
