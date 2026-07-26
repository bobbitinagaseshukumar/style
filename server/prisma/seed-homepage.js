/**
 * Seed Default Homepage Sections
 * 
 * Run with:  node server/prisma/seed-homepage.js
 * 
 * This creates default sections (Kids Wear, Festive Collection, etc.)
 * ONLY if those slugs don't already exist — safe to run repeatedly.
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const prisma = new PrismaClient();

const DEFAULT_SECTIONS = [
  {
    title: 'New Arrivals',
    slug: 'new-arrivals-default',
    subtitle: 'Fresh styles just landed in our catalogue',
    sectionIcon: '✨',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFFFFF',
    textColor: '#111827',
    buttonText: 'View All New Arrivals',
    buttonLink: '/categories',
    sortOrder: 0,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: 'Best Sellers',
    slug: 'best-sellers-default',
    subtitle: 'Our most loved products chosen by customers',
    sectionIcon: '⭐',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFFBEB',
    textColor: '#111827',
    buttonText: 'Shop Best Sellers',
    buttonLink: '/categories',
    sortOrder: 1,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: "Royal Jewellery Collection",
    slug: 'jewellery-collection-default',
    subtitle: 'Exquisite Kundan, Gold-Plated & Temple Jewellery',
    sectionIcon: '💎',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FAFAF7',
    textColor: '#111827',
    buttonText: 'Explore Jewellery',
    buttonLink: '/categories/jewellery',
    sortOrder: 2,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: "Banarasi & Silk Sarees",
    slug: 'silk-sarees-default',
    subtitle: 'Handwoven pure silk sarees with gold zari borders',
    sectionIcon: '🥻',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFFFFF',
    textColor: '#111827',
    buttonText: 'Explore Sarees',
    buttonLink: '/categories/womens-sarees',
    sortOrder: 3,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: "Men's Royal Heritage",
    slug: 'mens-royal-heritage-default',
    subtitle: 'Smart casuals, festive shirts & premium kurtas',
    sectionIcon: '👔',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#F8F9FC',
    textColor: '#111827',
    buttonText: "Shop Men's Collection",
    buttonLink: '/categories/mens-wear',
    sortOrder: 4,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: "Kids Wear & Festive Suits",
    slug: 'kids-wear-default',
    subtitle: 'Charming ethnic and casual wear for little ones',
    sectionIcon: '👶',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 8,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFF7F0',
    textColor: '#111827',
    buttonText: 'Shop Kids Collection',
    buttonLink: '/categories/kids-wear',
    sortOrder: 5,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
  {
    title: "Festive Collection",
    slug: 'festive-collection-default',
    subtitle: 'Premium festive wear for every celebration',
    sectionIcon: '🏮',
    layoutType: 'GRID',
    productIds: '[]',
    maxProducts: 12,
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFFBEB',
    textColor: '#78350F',
    buttonText: 'Shop Festive Collection',
    buttonLink: '/categories',
    sortOrder: 6,
    devices: '["DESKTOP","TABLET","MOBILE"]',
  },
];

async function main() {
  console.log('🌱 Seeding default homepage sections…\n');

  let created = 0;
  let skipped = 0;

  for (const section of DEFAULT_SECTIONS) {
    try {
      const existing = await prisma.homepageSection.findUnique({ where: { slug: section.slug } });
      if (existing) {
        console.log(`  ⏭  Skipped "${section.title}" — already exists`);
        skipped++;
      } else {
        await prisma.homepageSection.create({ data: section });
        console.log(`  ✅ Created "${section.title}"`);
        created++;
      }
    } catch (err) {
      console.error(`  ❌ Error creating "${section.title}":`, err.message);
    }
  }

  console.log(`\n✅ Done! Created: ${created} · Skipped: ${skipped}`);
  console.log('\n👉 Go to Admin → CMS → Homepage Sections to add products to each section.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
