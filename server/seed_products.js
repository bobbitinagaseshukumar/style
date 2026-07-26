const prisma = require('./config/db');

const initialProducts = [
  {
    name: 'Kanjivaram Pure Silk Saree with Zari Border',
    slug: 'kanjivaram-pure-silk-saree-with-zari-border',
    sku: 'SKU-SAR-001',
    categorySlug: 'womens-sarees',
    price: 18999,
    discountPrice: 14999,
    discountPercent: 21,
    stock: 15,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: true,
    todaysDeal: true,
    flashSale: true,
    shortDesc: 'Handcrafted Kanjivaram silk saree with rich golden zari pallu and traditional motifs.',
    description: '<p>Experience true royal elegance with this authentic Kanjivaram Pure Silk Saree. Woven with unadulterated silk threads and embellished with genuine zari work across the border and pallu.</p>',
    sizes: JSON.stringify(['Free Size']),
    colors: JSON.stringify(['Royal Crimson', 'Golden Yellow', 'Deep Emerald']),
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'
    ]
  },
  {
    name: '22K Gold Plated Royal Kundan Choker Necklace Set',
    slug: '22k-gold-plated-royal-kundan-choker-necklace-set',
    sku: 'SKU-JWL-002',
    categorySlug: 'jewellery',
    price: 11999,
    discountPrice: 8499,
    discountPercent: 29,
    stock: 8,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: true,
    todaysDeal: true,
    flashSale: true,
    shortDesc: 'Intricately handcrafted Kundan choker with matching earrings and maang tikka.',
    description: '<p>Adorn yourself like royalty with our signature 22K Gold Plated Kundan Choker set. Embedded with high-grade Kundan stones and freshwater pearl drops.</p>',
    sizes: JSON.stringify(['Adjustable']),
    colors: JSON.stringify(['Gold-Red', 'Gold-Green', 'Gold-White']),
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
      'https://images.unsplash.com/photo-1515562141589-67f0d93e5bb6?w=800'
    ]
  },
  {
    name: 'Handcrafted Heritage Art Silk Kurta Set for Men',
    slug: 'handcrafted-heritage-art-silk-kurta-set-for-men',
    sku: 'SKU-MEN-003',
    categorySlug: 'mens-wear',
    price: 5999,
    discountPrice: 4299,
    discountPercent: 28,
    stock: 20,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: true,
    todaysDeal: true,
    flashSale: false,
    shortDesc: 'Traditional silk blend kurta with embroidered mandarin collar and churidar pajama.',
    description: '<p>Crafted for celebrations, this Art Silk Kurta set features refined embroidery on the collar and placket. Soft, breathable fabric for modern gentlemen.</p>',
    sizes: JSON.stringify(['M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Ivory White', 'Royal Navy', 'Maroon Gold']),
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=800'
    ]
  },
  {
    name: 'Antique Temple Work Gold Plated Bangles (Set of 4)',
    slug: 'antique-temple-work-gold-plated-bangles',
    sku: 'SKU-JWL-004',
    categorySlug: 'jewellery',
    price: 3999,
    discountPrice: 2999,
    discountPercent: 25,
    stock: 14,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: false,
    bestSeller: true,
    todaysDeal: false,
    flashSale: true,
    shortDesc: 'Traditional South Indian temple design brass bangles with antique gold finish.',
    description: '<p>Complete your ethnic ensemble with these exquisite temple bangles showcasing Goddess Lakshmi carvings and intricate filigree work.</p>',
    sizes: JSON.stringify(['2.4', '2.6', '2.8']),
    colors: JSON.stringify(['Antique Gold']),
    images: [
      'https://images.unsplash.com/photo-1611591475777-233cd73be338?w=800'
    ]
  },
  {
    name: 'Designer Anarkali Heavy Embroidered Suit Set',
    slug: 'designer-anarkali-heavy-embroidered-suit-set',
    sku: 'SKU-KRT-005',
    categorySlug: 'womens-kurtis',
    price: 8999,
    discountPrice: 6499,
    discountPercent: 27,
    stock: 10,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: false,
    todaysDeal: true,
    flashSale: true,
    shortDesc: 'Georgette Anarkali suit with zari threadwork, pants, and organza dupatta.',
    description: '<p>Make heads turn at weddings and festivals in this graceful Anarkali suit set with elaborate mirror work and heavy border dupatta.</p>',
    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Dusty Rose', 'Mint Green', 'Powder Blue']),
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'
    ]
  },
  {
    name: 'Royal Bridal Velvet Lehenga Choli with Zardozi Work',
    slug: 'royal-bridal-velvet-lehenga-choli-with-zardozi-work',
    sku: 'SKU-LHG-006',
    categorySlug: 'lehengas',
    price: 34999,
    discountPrice: 27999,
    discountPercent: 20,
    stock: 5,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: true,
    todaysDeal: false,
    flashSale: false,
    shortDesc: 'Deep maroon micro-velvet lehenga with opulent Zardozi & Dori hand embroidery.',
    description: '<p>A masterpiece for brides. Crafted from premium velvet with extensive hand embroidered peacock and floral motifs.</p>',
    sizes: JSON.stringify(['Custom Fitted', 'Semi-Stitched']),
    colors: JSON.stringify(['Maroon Red', 'Emerald Green', 'Royal Blue']),
    images: [
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'
    ]
  },
  {
    name: 'Festive Ethnic Sherwani with Stole & Churidar',
    slug: 'festive-ethnic-sherwani-with-stole-churidar',
    sku: 'SKU-MEN-007',
    categorySlug: 'mens-wear',
    price: 14999,
    discountPrice: 11499,
    discountPercent: 23,
    stock: 7,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: false,
    trending: true,
    newArrival: true,
    bestSeller: true,
    todaysDeal: false,
    flashSale: true,
    shortDesc: 'Jacquard brocade silk sherwani with hand embroidered collar and matching dupatta stole.',
    description: '<p>Designed for grooms and groomsmen. Features intricate self-woven brocade textures and regal button embellishments.</p>',
    sizes: JSON.stringify(['38', '40', '42', '44']),
    colors: JSON.stringify(['Cream Gold', 'Pastel Pink', 'Royal Beige']),
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
    ]
  },
  {
    name: 'Kids Royal Silk Kurta Dhoti Set',
    slug: 'kids-royal-silk-kurta-dhoti-set',
    sku: 'SKU-KID-008',
    categorySlug: 'kids-wear',
    price: 2999,
    discountPrice: 1999,
    discountPercent: 33,
    stock: 18,
    status: 'PUBLISHED',
    isVisible: true,
    showOnHomepage: true,
    featured: true,
    trending: false,
    newArrival: true,
    bestSeller: false,
    todaysDeal: true,
    flashSale: true,
    shortDesc: 'Soft cotton-silk blend festive outfit for boys aged 2 to 10 years.',
    description: '<p>Keep your little ones comfortable and stylish during festive events with skin-friendly cotton silk fabrics.</p>',
    sizes: JSON.stringify(['2-3 Yrs', '4-5 Yrs', '6-7 Yrs', '8-9 Yrs']),
    colors: JSON.stringify(['Yellow Gold', 'Royal Blue', 'Pista Green']),
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800'
    ]
  }
];

async function seedProducts() {
  console.log('Seeding initial products into database...');
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.error('No categories found! Please check categories table.');
    return;
  }

  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c.slug] = c.id;
  });

  for (const item of initialProducts) {
    const categoryId = categoryMap[item.categorySlug] || categories[0].id;
    const { categorySlug, images, ...prodData } = item;

    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (existing) {
      console.log(`Product "${item.name}" already exists. Skipping.`);
      continue;
    }

    const created = await prisma.product.create({
      data: {
        ...prodData,
        categoryId,
        images: {
          create: images.map((url, idx) => ({
            url,
            isPrimary: idx === 0
          }))
        }
      }
    });
    console.log(`Created product: ${created.name} (${created.id})`);
  }
  console.log('Product seeding completed successfully!');
}

seedProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
