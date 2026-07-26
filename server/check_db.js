const prisma = require('./config/db');

async function main() {
  const count = await prisma.product.count();
  console.log('DB Product Count:', count);
  const products = await prisma.product.findMany({
    include: { images: true, category: true, subCategory: true }
  });
  console.log('DB Products:', JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
