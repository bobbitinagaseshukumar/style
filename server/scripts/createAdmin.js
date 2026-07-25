const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'nagaseshukumarbobbiti@gmail.com';
  const plainPassword = 'seshu@2409';

  console.log(`👑 Creating Super Admin account for ${email}...`);
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      fullName: 'Naga Seshu Kumar Bobbiti',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      fullName: 'Naga Seshu Kumar Bobbiti',
      email: email.toLowerCase(),
      phone: '+91 98765 43210',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Super Admin account created successfully!');
  console.log(`  • User ID: ${user.id}`);
  console.log(`  • Full Name: ${user.fullName}`);
  console.log(`  • Email: ${user.email}`);
  console.log(`  • Role: ${user.role}`);
  console.log('  • Status: Active & Verified');
}

createSuperAdmin()
  .catch(err => console.error('❌ Error creating admin:', err))
  .finally(() => prisma.$disconnect());
