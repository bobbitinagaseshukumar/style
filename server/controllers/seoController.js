const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Dynamic XML Sitemap Generator
exports.getSitemapXML = asyncHandler(async (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const products = await prisma.product.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } });
  const categories = await prisma.category.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static Pages
  const staticPages = ['', '/categories', '/about', '/contact', '/faq', '/privacy-policy', '/terms'];
  staticPages.forEach(p => {
    xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Dynamic Categories
  categories.forEach(c => {
    xml += `  <url>\n    <loc>${baseUrl}/categories/${c.slug}</loc>\n    <lastmod>${c.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  });

  // Dynamic Products
  products.forEach(p => {
    xml += `  <url>\n    <loc>${baseUrl}/product/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.status(200).send(xml);
});

// Dynamic Robots.txt Generator
exports.getRobotsTXT = asyncHandler(async (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const content = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout\nDisallow: /cart\n\nSitemap: ${baseUrl}/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.status(200).send(content);
});

// Get SEO Settings
exports.getSEOSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.sEOSetting.findMany();
  res.status(200).json({ success: true, data: settings });
});

// Update SEO Setting
exports.updateSEOSetting = asyncHandler(async (req, res) => {
  const { pageSlug, metaTitle, metaDescription, keywords, ogImage, canonicalUrl, isIndexed } = req.body;

  const setting = await prisma.sEOSetting.upsert({
    where: { pageSlug },
    update: { metaTitle, metaDescription, keywords, ogImage, canonicalUrl, isIndexed },
    create: { pageSlug, metaTitle, metaDescription, keywords, ogImage, canonicalUrl, isIndexed: isIndexed !== false },
  });

  res.status(200).json({ success: true, message: 'SEO setting updated', data: setting });
});
