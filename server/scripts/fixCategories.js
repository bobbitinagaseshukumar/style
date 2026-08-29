const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCategories() {
  console.log('Fixing categories...\n');

  // Delete unwanted categories
  const toDelete = ['womens-sarees', 'womens-kurtis', 'lehengas', 'night-wear', 'festival-collection'];
  
  for (const slug of toDelete) {
    try {
      await prisma.category.delete({ where: { slug } });
      console.log('Deleted: ' + slug);
    } catch(e) {
      console.log('Skip: ' + slug + ' (not found or has products)');
    }
  }

  // Check remaining
  const remaining = await prisma.category.findMany({ select: { name: true, slug: true } });
  console.log('\nRemaining categories:');
  remaining.forEach(c => console.log('  ' + c.name + ' (' + c.slug + ')'));

  // Create Women's Wear category if not exists
  const hasWomenWear = remaining.some(c => c.slug === 'womens-wear');
  if (!hasWomenWear) {
    await prisma.category.create({
      data: {
        name: "Women's Wear",
        slug: 'womens-wear',
        description: 'Trendy clothing for women',
        showOnHomepage: true,
        inNavMenu: true,
        inMegaMenu: true,
        inSearchFilters: true,
        inMobileMenu: true,
      }
    });
    console.log("\nCreated: Women's Wear (womens-wear)");
  }

  const final = await prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } });
  console.log('\n=== Final 4 Categories ===');
  final.forEach(c => console.log('  ' + c.name + ' (' + c.slug + ')'));

  await prisma.$disconnect();
}

fixCategories();
