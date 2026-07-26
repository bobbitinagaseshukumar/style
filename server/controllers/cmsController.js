const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== Store Settings ====================
exports.getStoreSettings = asyncHandler(async (req, res) => {
    const settings = await prisma.storeSettings.findFirst();
    res.status(200).json({ success: true, data: settings });
});

exports.updateStoreSettings = asyncHandler(async (req, res) => {
    const updateData = req.body;
    let settings = await prisma.storeSettings.findFirst();
    
    if (settings) {
        settings = await prisma.storeSettings.update({ where: { id: settings.id }, data: updateData });
    } else {
        settings = await prisma.storeSettings.create({ data: { id: 'default', ...updateData } });
    }
    
    res.status(200).json({ success: true, message: 'Settings updated', data: settings });
});

// ==================== Contact Messages ====================
exports.submitContactMessage = asyncHandler(async (req, res, next) => {
    const { fullName, email, phone, subject, message } = req.body;
    if (!fullName || !email || !subject || !message) {
        return next(new ApiError(400, 'Please fill in Name, Email, Subject, and Message'));
    }

    const contactMsg = await prisma.contactMessage.create({
        data: { fullName, email, phone: phone || null, subject, message }
    });

    res.status(201).json({
        success: true,
        message: 'Thank you! Your message has been sent to our customer support team.',
        data: contactMsg
    });
});

exports.adminGetContactMessages = asyncHandler(async (req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: messages });
});

// ==================== Newsletter Subscribers ====================
exports.subscribeNewsletter = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new ApiError(400, 'Email address is required'));

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
        return res.status(200).json({ success: true, message: 'You are already subscribed to StyleVerse newsletter!' });
    }

    const sub = await prisma.newsletterSubscriber.create({
        data: { email: email.toLowerCase() }
    });

    res.status(201).json({
        success: true,
        message: 'Subscription successful! Thank you for subscribing.',
        data: sub
    });
});

exports.adminGetNewsletterSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: subscribers });
});

// ==================== Announcements ====================
exports.getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' }
    });
    res.status(200).json({ success: true, data: announcements });
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
    const announcement = await prisma.announcement.create({ data: req.body });
    res.status(201).json({ success: true, message: 'Announcement created', data: announcement });
});

exports.updateAnnouncement = asyncHandler(async (req, res) => {
    const announcement = await prisma.announcement.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, message: 'Announcement updated', data: announcement });
});

exports.deleteAnnouncement = asyncHandler(async (req, res) => {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Announcement deleted' });
});

// ==================== Banners ====================
exports.getBanners = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.position) where.position = req.query.position;
    if (req.query.bannerType) where.bannerType = req.query.bannerType;
    if (req.query.activeOnly === 'true') {
        where.isActive = true;
        where.status = 'PUBLISHED';
    }
    const banners = await prisma.banner.findMany({ where, orderBy: { priority: 'desc' } });
    res.status(200).json({ success: true, data: banners });
});

exports.getBannerStats = asyncHandler(async (req, res) => {
    const all = await prisma.banner.findMany();
    const now = new Date();
    const total = all.length;
    const published = all.filter(b => b.status === 'PUBLISHED' && b.isActive).length;
    const draft = all.filter(b => b.status === 'DRAFT').length;
    const scheduled = all.filter(b => b.status === 'SCHEDULED').length;
    const expired = all.filter(b => b.endDate && new Date(b.endDate) < now).length;
    const hidden = all.filter(b => b.status === 'HIDDEN').length;
    const totalViews = all.reduce((sum, b) => sum + (b.views || 0), 0);
    const totalClicks = all.reduce((sum, b) => sum + (b.clicks || 0), 0);
    res.status(200).json({
        success: true,
        data: { total, published, draft, scheduled, expired, hidden, totalViews, totalClicks }
    });
});

exports.createBanner = asyncHandler(async (req, res) => {
    const {
        title, subtitle, description, imageUrl, buttonText, buttonLink,
        textColor, buttonColor, overlayOpacity, textAlignment,
        bannerType, position, priority, sortOrder, status, isActive,
        devices, altText, seoTitle, seoDescription, startDate, endDate
    } = req.body;

    if (!imageUrl) return res.status(400).json({ success: false, message: 'Banner image URL is required' });

    const banner = await prisma.banner.create({
        data: {
            title: title || null,
            subtitle: subtitle || null,
            description: description || null,
            imageUrl,
            buttonText: buttonText || null,
            buttonLink: buttonLink || null,
            textColor: textColor || '#FFFFFF',
            buttonColor: buttonColor || '#D4AF37',
            overlayOpacity: overlayOpacity !== undefined ? parseFloat(overlayOpacity) : 0.3,
            textAlignment: textAlignment || 'CENTER',
            bannerType: bannerType || 'STATIC',
            position: position || 'HOMEPAGE_HERO',
            priority: priority ? parseInt(priority) : 0,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            status: status || 'PUBLISHED',
            isActive: isActive !== false,
            devices: devices || '["DESKTOP","TABLET","MOBILE"]',
            altText: altText || null,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        }
    });
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
});

exports.updateBanner = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };
    if (updateData.overlayOpacity !== undefined) updateData.overlayOpacity = parseFloat(updateData.overlayOpacity);
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority);
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: updateData });
    res.status(200).json({ success: true, message: 'Banner updated', data: banner });
});

exports.duplicateBanner = asyncHandler(async (req, res) => {
    const source = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Banner not found' });
    const { id, createdAt, updatedAt, views, clicks, ...rest } = source;
    const duplicate = await prisma.banner.create({
        data: { ...rest, title: (rest.title || 'Banner') + ' (Copy)', status: 'DRAFT', isActive: false, views: 0, clicks: 0 }
    });
    res.status(201).json({ success: true, message: 'Banner duplicated', data: duplicate });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Banner deleted' });
});

exports.trackBannerView = asyncHandler(async (req, res) => {
    await prisma.banner.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
    res.status(200).json({ success: true });
});

exports.trackBannerClick = asyncHandler(async (req, res) => {
    await prisma.banner.update({ where: { id: req.params.id }, data: { clicks: { increment: 1 } } });
    res.status(200).json({ success: true });
});

// ==================== Flash Sales ====================
exports.getFlashSale = asyncHandler(async (req, res) => {
    const now = new Date();
    const flashSale = await prisma.flashSale.findFirst({
        where: {
            isActive: true,
            status: 'PUBLISHED',
            startDate: { lte: now },
            endDate: { gte: now }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!flashSale) {
        return res.status(200).json({ success: true, data: null });
    }

    // Fetch products belonging to this Flash Sale
    let pIds = [];
    try { pIds = JSON.parse(flashSale.productIds || '[]'); } catch (e) { pIds = []; }

    let products = [];
    if (pIds.length > 0) {
        products = await prisma.product.findMany({
            where: { id: { in: pIds }, status: 'PUBLISHED', isVisible: true },
            include: { images: true, category: { select: { name: true, slug: true } } }
        });

        // Compute Flash Sale discounted prices
        products = products.map(p => {
            let flashPrice = p.price;
            let discountPercent = p.discountPercent || 0;

            if (flashSale.discountType === 'PERCENTAGE') {
                discountPercent = Math.max(discountPercent, flashSale.discountValue);
                flashPrice = Math.round(p.price - (p.price * discountPercent / 100));
            } else if (flashSale.discountType === 'FIXED') {
                flashPrice = Math.max(0, p.price - flashSale.discountValue);
                discountPercent = Math.round(((p.price - flashPrice) / p.price) * 100);
            }

            return {
                ...p,
                originalPrice: p.price,
                price: p.price,
                discountPrice: flashPrice,
                discountPercent,
                isFlashSaleProduct: true
            };
        });
    }

    res.status(200).json({ success: true, data: { ...flashSale, products } });
});

exports.getAllFlashSalesAdmin = asyncHandler(async (req, res) => {
    const flashSales = await prisma.flashSale.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: flashSales });
});

exports.createFlashSale = asyncHandler(async (req, res) => {
    const { name, description, bannerUrl, bgColor, textColor, buttonColor, discountType, discountValue, startDate, endDate, productIds, status, isActive } = req.body;
    
    const flashSale = await prisma.flashSale.create({
        data: {
            name: name || 'Midnight Flash Sale',
            description: description || null,
            bannerUrl: bannerUrl || null,
            bgColor: bgColor || '#111827',
            textColor: textColor || '#FFFFFF',
            buttonColor: buttonColor || '#D4AF37',
            discountType: discountType || 'PERCENTAGE',
            discountValue: parseFloat(discountValue || 30),
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
            status: status || 'PUBLISHED',
            isActive: isActive !== false
        }
    });

    // Mark selected products as flashSale = true
    let pIds = [];
    try { pIds = JSON.parse(flashSale.productIds); } catch (e) { pIds = []; }
    if (pIds.length > 0) {
        await prisma.product.updateMany({
            where: { id: { in: pIds } },
            data: { flashSale: true }
        });
    }

    res.status(201).json({ success: true, message: 'Flash Sale created successfully', data: flashSale });
});

exports.updateFlashSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.discountValue !== undefined) updateData.discountValue = parseFloat(updateData.discountValue);
    if (typeof updateData.productIds === 'object') updateData.productIds = JSON.stringify(updateData.productIds);

    const flashSale = await prisma.flashSale.update({ where: { id }, data: updateData });

    // Sync product flags
    let pIds = [];
    try { pIds = JSON.parse(flashSale.productIds); } catch (e) { pIds = []; }
    if (pIds.length > 0) {
        await prisma.product.updateMany({
            where: { id: { in: pIds } },
            data: { flashSale: flashSale.status === 'PUBLISHED' && flashSale.isActive }
        });
    }

    res.status(200).json({ success: true, message: 'Flash Sale updated', data: flashSale });
});

exports.duplicateFlashSale = asyncHandler(async (req, res) => {
    const source = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Flash Sale not found' });
    const { id, createdAt, updatedAt, ...rest } = source;
    const duplicate = await prisma.flashSale.create({
        data: { ...rest, name: `${rest.name} (Copy)`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Flash Sale duplicated', data: duplicate });
});

exports.deleteFlashSale = asyncHandler(async (req, res) => {
    await prisma.flashSale.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Flash Sale deleted' });
});

// ==================== Special Deals ====================
exports.getSpecialDealsPublic = asyncHandler(async (req, res) => {
    const deals = await prisma.specialDeal.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });

    const enriched = await Promise.all(deals.map(async deal => {
        let pIds = [];
        try { pIds = JSON.parse(deal.productIds || '[]'); } catch (e) { pIds = []; }
        let products = [];
        if (pIds.length > 0) {
            products = await prisma.product.findMany({
                where: { id: { in: pIds }, status: 'PUBLISHED', isVisible: true },
                include: { images: true, category: { select: { name: true, slug: true } } }
            });
        }
        return { ...deal, products };
    }));

    res.status(200).json({ success: true, data: enriched });
});

exports.getAllSpecialDealsAdmin = asyncHandler(async (req, res) => {
    const deals = await prisma.specialDeal.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: deals });
});

exports.createSpecialDeal = asyncHandler(async (req, res) => {
    const { name, description, bannerUrl, buttonText, buttonLink, bgColor, textColor, productIds, startDate, endDate, status, isActive } = req.body;
    
    const deal = await prisma.specialDeal.create({
        data: {
            name,
            description: description || null,
            bannerUrl: bannerUrl || null,
            buttonText: buttonText || 'Shop Special Deal',
            buttonLink: buttonLink || '/offers',
            bgColor: bgColor || '#111827',
            textColor: textColor || '#FFFFFF',
            productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: status || 'PUBLISHED',
            isActive: isActive !== false
        }
    });

    res.status(201).json({ success: true, message: 'Special Deal created', data: deal });
});

exports.updateSpecialDeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (typeof updateData.productIds === 'object') updateData.productIds = JSON.stringify(updateData.productIds);

    const deal = await prisma.specialDeal.update({ where: { id }, data: updateData });
    res.status(200).json({ success: true, message: 'Special Deal updated', data: deal });
});

exports.duplicateSpecialDeal = asyncHandler(async (req, res) => {
    const source = await prisma.specialDeal.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Special Deal not found' });
    const { id, createdAt, updatedAt, ...rest } = source;
    const duplicate = await prisma.specialDeal.create({
        data: { ...rest, name: `${rest.name} (Copy)`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Special Deal duplicated', data: duplicate });
});

exports.deleteSpecialDeal = asyncHandler(async (req, res) => {
    await prisma.specialDeal.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Special Deal deleted' });
});

// ==================== Product Collections ====================
exports.getCollectionsPublic = asyncHandler(async (req, res) => {
    const collections = await prisma.productCollection.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });

    const enriched = await Promise.all(collections.map(async col => {
        let pIds = [];
        try { pIds = JSON.parse(col.productIds || '[]'); } catch (e) { pIds = []; }
        let products = [];
        if (pIds.length > 0) {
            products = await prisma.product.findMany({
                where: { id: { in: pIds }, status: 'PUBLISHED', isVisible: true },
                include: { images: true, category: { select: { name: true, slug: true } } }
            });
        }
        return { ...col, products };
    }));

    res.status(200).json({ success: true, data: enriched });
});

exports.getAllCollectionsAdmin = asyncHandler(async (req, res) => {
    const collections = await prisma.productCollection.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: collections });
});

exports.createCollection = asyncHandler(async (req, res) => {
    const { name, slug, description, bannerUrl, productIds, startDate, endDate, status, isActive } = req.body;
    const finalSlug = (slug || name || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const collection = await prisma.productCollection.create({
        data: {
            name,
            slug: `${finalSlug}-${Date.now().toString(36)}`,
            description: description || null,
            bannerUrl: bannerUrl || null,
            productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: status || 'PUBLISHED',
            isActive: isActive !== false
        }
    });

    res.status(201).json({ success: true, message: 'Collection created', data: collection });
});

exports.updateCollection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (typeof updateData.productIds === 'object') updateData.productIds = JSON.stringify(updateData.productIds);

    const collection = await prisma.productCollection.update({ where: { id }, data: updateData });
    res.status(200).json({ success: true, message: 'Collection updated', data: collection });
});

exports.duplicateCollection = asyncHandler(async (req, res) => {
    const source = await prisma.productCollection.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Collection not found' });
    const { id, createdAt, updatedAt, slug, ...rest } = source;
    const duplicate = await prisma.productCollection.create({
        data: { ...rest, name: `${rest.name} (Copy)`, slug: `${slug}-copy-${Date.now().toString(36)}`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Collection duplicated', data: duplicate });
});

exports.deleteCollection = asyncHandler(async (req, res) => {
    await prisma.productCollection.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Collection deleted' });
});


// ==================== Brands Showcase ====================
exports.getBrands = asyncHandler(async (req, res) => {
    const brands = await prisma.brandShowcase.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: brands });
});

// ==================== Testimonials ====================
exports.getTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: testimonials });
});

// ==================== Instagram Posts ====================
exports.getInstagramPosts = asyncHandler(async (req, res) => {
    const posts = await prisma.instagramPost.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: posts });
});

// ==================== Homepage Sections ====================
exports.getHomepageSections = asyncHandler(async (req, res) => {
    const sections = await prisma.homepageSection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: sections });
});

exports.getAllHomepageSectionsAdmin = asyncHandler(async (req, res) => {
    const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: sections });
});

exports.createHomepageSection = asyncHandler(async (req, res) => {
    const { title, sectionType, config, sortOrder, isActive } = req.body;
    
    // Count existing to set default sortOrder
    const count = await prisma.homepageSection.count();
    
    const section = await prisma.homepageSection.create({
        data: {
            title: title || 'New Homepage Section',
            sectionType: sectionType || 'FEATURED_PRODUCTS',
            config: typeof config === 'object' ? JSON.stringify(config) : (config || '{}'),
            sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : count,
            isActive: isActive !== false
        }
    });

    res.status(201).json({ success: true, message: 'Homepage section created', data: section });
});

exports.updateHomepageSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, sectionType, config, sortOrder, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (sectionType !== undefined) updateData.sectionType = sectionType;
    if (config !== undefined) updateData.config = typeof config === 'object' ? JSON.stringify(config) : config;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const section = await prisma.homepageSection.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({ success: true, message: 'Homepage section updated', data: section });
});

exports.duplicateHomepageSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const source = await prisma.homepageSection.findUnique({ where: { id } });
    if (!source) return res.status(404).json({ success: false, message: 'Section not found' });

    const count = await prisma.homepageSection.count();
    const duplicate = await prisma.homepageSection.create({
        data: {
            title: `${source.title} (Copy)`,
            sectionType: source.sectionType,
            config: source.config,
            sortOrder: count,
            isActive: false
        }
    });

    res.status(201).json({ success: true, message: 'Homepage section duplicated', data: duplicate });
});

exports.deleteHomepageSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.homepageSection.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Homepage section deleted' });
});

exports.reorderHomepageSections = asyncHandler(async (req, res) => {
    const { sections } = req.body; // Array of { id, sortOrder }
    if (Array.isArray(sections)) {
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            await prisma.homepageSection.update({
                where: { id: sec.id },
                data: { sortOrder: sec.sortOrder !== undefined ? parseInt(sec.sortOrder) : i }
            });
        }
    }
    const updated = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, message: 'Homepage sections reordered', data: updated });
});

exports.updateHomepageSections = asyncHandler(async (req, res) => {
    const { sections } = req.body;
    if (Array.isArray(sections)) {
        for (const section of sections) {
            await prisma.homepageSection.update({ where: { id: section.id }, data: section });
        }
    }
    const updated = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, message: 'Homepage sections updated', data: updated });
});


// ==================== CMS Pages ====================
exports.getAllCMSPages = asyncHandler(async (req, res) => {
    const pages = await prisma.cMSPage.findMany({ orderBy: { updatedAt: 'desc' } });
    res.status(200).json({ success: true, data: pages });
});

exports.getCMSPage = asyncHandler(async (req, res, next) => {
    const page = await prisma.cMSPage.findUnique({ where: { slug: req.params.slug } });
    if (!page) return next(new ApiError(404, 'Page not found'));
    res.status(200).json({ success: true, data: page });
});

exports.createCMSPage = asyncHandler(async (req, res) => {
    const { title, slug, content, seoTitle, metaDescription, keywords, isPublished } = req.body;
    const finalSlug = (slug || title || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await prisma.cMSPage.findUnique({ where: { slug: finalSlug } });
    if (existing) return res.status(400).json({ success: false, message: 'A page with this slug already exists' });

    const page = await prisma.cMSPage.create({
        data: {
            title: title || 'New Page',
            slug: finalSlug,
            content: content || '',
            seoTitle: seoTitle || null,
            metaDescription: metaDescription || null,
            keywords: keywords || null,
            isPublished: isPublished !== false,
        }
    });
    res.status(201).json({ success: true, message: 'Page created', data: page });
});

exports.updateCMSPage = asyncHandler(async (req, res) => {
    const { title, content, seoTitle, metaDescription, keywords, isPublished } = req.body;
    const slug = req.params.slug;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const page = await prisma.cMSPage.upsert({
        where: { slug },
        update: updateData,
        create: { title: title || slug, slug, content: content || '', seoTitle, metaDescription, keywords, isPublished: isPublished !== false }
    });

    res.status(200).json({ success: true, message: 'Page updated', data: page });
});

exports.duplicateCMSPage = asyncHandler(async (req, res) => {
    const source = await prisma.cMSPage.findUnique({ where: { slug: req.params.slug } });
    if (!source) return res.status(404).json({ success: false, message: 'Page not found' });

    const newSlug = `${source.slug}-copy-${Date.now().toString(36)}`;
    const page = await prisma.cMSPage.create({
        data: {
            title: `${source.title} (Copy)`,
            slug: newSlug,
            content: source.content,
            seoTitle: source.seoTitle,
            metaDescription: source.metaDescription,
            keywords: source.keywords,
            isPublished: false,
        }
    });
    res.status(201).json({ success: true, message: 'Page duplicated', data: page });
});

exports.deleteCMSPage = asyncHandler(async (req, res) => {
    await prisma.cMSPage.delete({ where: { slug: req.params.slug } });
    res.status(200).json({ success: true, message: 'Page deleted' });
});

// ==================== Contact Message Management ====================
exports.markContactMessageRead = asyncHandler(async (req, res) => {
    const msg = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { isRead: true }
    });
    res.status(200).json({ success: true, data: msg });
});

exports.deleteContactMessage = asyncHandler(async (req, res) => {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Message deleted' });
});

// ==================== Newsletter Subscriber Management ====================
exports.deleteNewsletterSubscriber = asyncHandler(async (req, res) => {
    await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Subscriber removed' });
});

// ==================== FAQs ====================
exports.getFAQs = asyncHandler(async (req, res) => {
    const faqs = await prisma.fAQ.findMany({ orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: faqs });
});

exports.createFAQ = asyncHandler(async (req, res) => {
    const { question, answer, category, sortOrder } = req.body;
    const faq = await prisma.fAQ.create({
        data: { question, answer, category: category || 'General', sortOrder: parseInt(sortOrder || 0) }
    });
    res.status(201).json({ success: true, message: 'FAQ created', data: faq });
});

exports.updateFAQ = asyncHandler(async (req, res) => {
    const faq = await prisma.fAQ.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, message: 'FAQ updated', data: faq });
});

exports.deleteFAQ = asyncHandler(async (req, res) => {
    await prisma.fAQ.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'FAQ deleted' });
});
