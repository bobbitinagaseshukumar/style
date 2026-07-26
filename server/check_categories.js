const prisma = require('./config/db');

async function main() {
  const categories = await prisma.category.findMany({ include: { subcategories: true } });
  console.log('DB Categories Count:', categories.length);
  console.log('Categories:', JSON.stringify(categories, null, 2));

  const brands = await prisma.brand.findMany();
  console.log('DB Brands Count:', brands.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
