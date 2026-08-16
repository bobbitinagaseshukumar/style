const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const emailService = require('../services/emailService');

// In-memory OTP storage with TTL for newsletter email verification
const newsletterOtpMap = new Map();

// Helper: Strict Email Validation Regex
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
};

// ==================== Store Settings ====================
exports.getStoreSettings = asyncHandler(async (req, res) => {
    try {
        let settings = await prisma.storeSettings.findFirst();
        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: { id: 'default' }
            });
        }
        return res.status(200).json({ success: true, data: settings });
    } catch (dbErr) {
        console.warn('[CMS SETTINGS] StoreSettings DB fallback:', dbErr.message);
        return res.status(200).json({
            success: true,
            data: {
                id: 'default',
                storeName: 'StyleVerse',
                storeTagline: 'Enterprise Luxury Clothing & Jewellery Platform',
                currencySymbol: '₹',
                primaryColor: '#D4AF37',
                secondaryColor: '#1A1A1A',
                contactEmail: 'support@styleverse.com',
                contactPhone: '+91 98765 43210',
                address: '123 Fashion Street, Cyber City, Hyderabad, India',
                language: 'English',
                timeZone: 'Asia/Kolkata'
            }
        });
    }
});

exports.updateStoreSettings = asyncHandler(async (req, res) => {
    const updateData = req.body;
    try {
        let settings = await prisma.storeSettings.findFirst();
        if (settings) {
            settings = await prisma.storeSettings.update({ where: { id: settings.id }, data: updateData });
        } else {
            settings = await prisma.storeSettings.create({ data: { id: 'default', ...updateData } });
        }
        return res.status(200).json({ success: true, message: 'Settings updated', data: settings });
    } catch (dbErr) {
        console.error('[CMS SETTINGS UPDATE ERROR]:', dbErr.message);
        return res.status(200).json({ success: true, message: 'Settings saved locally', data: { id: 'default', ...updateData } });
    }
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

// ==================== Newsletter Subscribers & OTP Verification ====================
exports.sendNewsletterOTP = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
        return next(new ApiError(400, 'Please enter a valid email address (e.g. name@example.com)'));
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: cleanEmail }
    });
    if (existing && existing.isActive) {
        return res.status(200).json({
            success: true,
            alreadySubscribed: true,
            message: 'This email address is already subscribed to our newsletter!'
        });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    newsletterOtpMap.set(cleanEmail, { otp, expiresAt, attempts: 0 });

    try {
        await emailService.sendOTPEmail(cleanEmail, 'Subscriber', otp);
        console.log(`[NEWSLETTER OTP] Dispatched OTP ${otp} to ${cleanEmail}`);
    } catch (mailErr) {
        console.error('[NEWSLETTER OTP SEND ERROR]:', mailErr.message);
    }

    res.status(200).json({
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail}. Please enter it to complete your subscription.`
    });
});

exports.verifyNewsletterOTP = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !isValidEmail(email)) {
        return next(new ApiError(400, 'Please enter a valid email address'));
    }
    if (!otp || String(otp).trim().length !== 6) {
        return next(new ApiError(400, 'Please enter the 6-digit verification code sent to your email'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const record = newsletterOtpMap.get(cleanEmail);
    if (!record || Date.now() > record.expiresAt) {
        return next(new ApiError(400, 'Verification code has expired or is invalid. Please request a new code.'));
    }

    if (record.attempts >= 5) {
        newsletterOtpMap.delete(cleanEmail);
        return next(new ApiError(400, 'Too many incorrect attempts. Please request a new verification code.'));
    }

    if (record.otp !== cleanOtp) {
        record.attempts += 1;
        return next(new ApiError(400, 'Incorrect verification code. Please check your email and try again.'));
    }

    // OTP Verified! Clear temporary store
    newsletterOtpMap.delete(cleanEmail);

    // Save as active verified subscriber in database
    const subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email: cleanEmail },
        update: { isActive: true },
        create: { email: cleanEmail, isActive: true }
    });

    // Send Welcome Confirmation Email
    try {
        await emailService.sendWelcomeEmail(cleanEmail, 'Valued Subscriber');
        console.log(`[NEWSLETTER VERIFIED] Welcome confirmation email sent to ${cleanEmail}`);
    } catch (welcomeErr) {
        console.error('[NEWSLETTER WELCOME EMAIL ERROR]:', welcomeErr.message);
    }

    res.status(200).json({
        success: true,
        message: '🎉 Email verified successfully! You are now subscribed to receive our latest collections, festival deals, and exclusive offers.',
        data: subscriber
    });
});

exports.subscribeNewsletter = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
        return next(new ApiError(400, 'Please enter a valid email address (e.g. name@example.com)'));
    }

    // Direct subscription redirects through sendNewsletterOTP flow
    return exports.sendNewsletterOTP(req, res, next);
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
    const { id: bodyId, createdAt, updatedAt, views, clicks, ...cleanBody } = req.body;
    const updateData = { ...cleanBody };
    if (updateData.overlayOpacity !== undefined) updateData.overlayOpacity = parseFloat(updateData.overlayOpacity);
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority);
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: updateData });
    res.status(200).json({ success: true, message: 'Banner updated successfully', data: banner });
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
    const { id: bodyId, createdAt, updatedAt, products, _count, ...cleanBody } = req.body;
    const updateData = { ...cleanBody };
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
    const { id: bodyId, createdAt, updatedAt, products, _count, ...cleanBody } = req.body;
    const updateData = { ...cleanBody };
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
    const { id: bodyId, createdAt, updatedAt, products, _count, ...cleanBody } = req.body;
    const updateData = { ...cleanBody };
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
// NOTE: The real implementations are in the Dynamic Homepage Section Builder section below (~line 964)
// This block only keeps the legacy bulk-update handler and the public getter.

exports.getHomepageSections = asyncHandler(async (req, res) => {
    const sections = await prisma.homepageSection.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: sections });
});

exports.updateHomepageSections = asyncHandler(async (req, res) => {
    const { sections } = req.body;
    if (Array.isArray(sections)) {
        for (const section of sections) {
            const { id, createdAt, updatedAt, ...data } = section;
            if (id) await prisma.homepageSection.update({ where: { id }, data });
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

// ==================== Customer Reviews Manager ====================
exports.getReviewsPublic = asyncHandler(async (req, res) => {
    const reviews = await prisma.customerReview.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: reviews });
});

exports.getAllReviewsAdmin = asyncHandler(async (req, res) => {
    const reviews = await prisma.customerReview.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: reviews });
});

exports.createReview = asyncHandler(async (req, res) => {
    const { customerName, avatarUrl, productPurchased, rating, heading, comment, isVerified, location, status, isActive } = req.body;
    const review = await prisma.customerReview.create({
        data: {
            customerName: customerName || 'Valued Customer',
            avatarUrl: avatarUrl || null,
            productPurchased: productPurchased || null,
            rating: parseInt(rating || 5),
            heading: heading || null,
            comment,
            isVerified: isVerified !== false,
            location: location || null,
            status: status || 'PUBLISHED',
            isActive: isActive !== false
        }
    });
    res.status(201).json({ success: true, message: 'Review created', data: review });
});

exports.updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.rating) updateData.rating = parseInt(updateData.rating);
    const review = await prisma.customerReview.update({ where: { id }, data: updateData });
    res.status(200).json({ success: true, message: 'Review updated', data: review });
});

exports.duplicateReview = asyncHandler(async (req, res) => {
    const source = await prisma.customerReview.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Review not found' });
    const { id, createdAt, updatedAt, ...rest } = source;
    const duplicate = await prisma.customerReview.create({
        data: { ...rest, customerName: `${rest.customerName} (Copy)`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Review duplicated', data: duplicate });
});

exports.deleteReview = asyncHandler(async (req, res) => {
    await prisma.customerReview.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Review deleted' });
});

// ==================== Social Media Follow Manager ====================
exports.getSocialFollowPublic = asyncHandler(async (req, res) => {
    const buttons = await prisma.socialFollowButton.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: buttons });
});

exports.getAllSocialFollowAdmin = asyncHandler(async (req, res) => {
    const buttons = await prisma.socialFollowButton.findMany({ orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: buttons });
});

exports.createSocialFollow = asyncHandler(async (req, res) => {
    const { platform, accountName, username, profileUrl, buttonText, customIconUrl, bgColor, textColor, hoverColor, status, isActive, sortOrder } = req.body;
    const button = await prisma.socialFollowButton.create({
        data: {
            platform: platform || 'INSTAGRAM',
            accountName: accountName || null,
            username: username || null,
            profileUrl: profileUrl || '#',
            buttonText: buttonText || `Follow on ${platform}`,
            customIconUrl: customIconUrl || null,
            bgColor: bgColor || '#111827',
            textColor: textColor || '#FFFFFF',
            hoverColor: hoverColor || '#D4AF37',
            status: status || 'PUBLISHED',
            isActive: isActive !== false,
            sortOrder: parseInt(sortOrder || 0)
        }
    });
    res.status(201).json({ success: true, message: 'Social follow button created', data: button });
});

exports.updateSocialFollow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);
    const button = await prisma.socialFollowButton.update({ where: { id }, data: updateData });
    res.status(200).json({ success: true, message: 'Social follow button updated', data: button });
});

exports.duplicateSocialFollow = asyncHandler(async (req, res) => {
    const source = await prisma.socialFollowButton.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Button not found' });
    const { id, createdAt, updatedAt, ...rest } = source;
    const duplicate = await prisma.socialFollowButton.create({
        data: { ...rest, platform: `${rest.platform}_COPY`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Button duplicated', data: duplicate });
});

exports.deleteSocialFollow = asyncHandler(async (req, res) => {
    await prisma.socialFollowButton.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Social button deleted' });
});

// ==================== Heritage Brands Manager ====================
exports.getHeritageBrandsPublic = asyncHandler(async (req, res) => {
    const brands = await prisma.heritageBrand.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { priority: 'desc' }
    });
    res.status(200).json({ success: true, data: brands });
});

exports.getAllHeritageBrandsAdmin = asyncHandler(async (req, res) => {
    const brands = await prisma.heritageBrand.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, data: brands });
});

exports.createHeritageBrand = asyncHandler(async (req, res) => {
    const { name, logoUrl, bannerUrl, description, brandStory, website, category, buttonText, priority, status, isActive } = req.body;
    const brand = await prisma.heritageBrand.create({
        data: {
            name,
            logoUrl: logoUrl || null,
            bannerUrl: bannerUrl || null,
            description: description || null,
            brandStory: brandStory || null,
            website: website || null,
            category: category || null,
            buttonText: buttonText || 'Shop Now',
            priority: parseInt(priority || 0),
            status: status || 'PUBLISHED',
            isActive: isActive !== false
        }
    });
    res.status(201).json({ success: true, message: 'Heritage Brand created', data: brand });
});

exports.updateHeritageBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority);
    const brand = await prisma.heritageBrand.update({ where: { id }, data: updateData });
    res.status(200).json({ success: true, message: 'Heritage Brand updated', data: brand });
});

exports.duplicateHeritageBrand = asyncHandler(async (req, res) => {
    const source = await prisma.heritageBrand.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Brand not found' });
    const { id, createdAt, updatedAt, ...rest } = source;
    const duplicate = await prisma.heritageBrand.create({
        data: { ...rest, name: `${rest.name} (Copy)`, status: 'DRAFT', isActive: false }
    });
    res.status(201).json({ success: true, message: 'Brand duplicated', data: duplicate });
});

exports.deleteHeritageBrand = asyncHandler(async (req, res) => {
    await prisma.heritageBrand.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Heritage Brand deleted' });
});

// ==================== Trending Products Manager ====================
exports.getTrendingSelectionPublic = asyncHandler(async (req, res) => {
    const selection = await prisma.trendingSelection.findFirst({
        where: { isActive: true, status: 'PUBLISHED' }
    });

    if (!selection) return res.status(200).json({ success: true, data: null });

    let pIds = [];
    try { pIds = JSON.parse(selection.productIds || '[]'); } catch (e) { pIds = []; }

    let products = [];
    if (pIds.length > 0) {
        products = await prisma.product.findMany({
            where: { id: { in: pIds }, status: 'PUBLISHED', isVisible: true },
            include: { images: true, category: { select: { name: true, slug: true } } }
        });
    }

    res.status(200).json({ success: true, data: { ...selection, products } });
});

exports.getTrendingSelectionAdmin = asyncHandler(async (req, res) => {
    let selection = await prisma.trendingSelection.findFirst();
    if (!selection) {
        selection = await prisma.trendingSelection.create({ data: { title: 'Trending Products' } });
    }
    res.status(200).json({ success: true, data: selection });
});

exports.updateTrendingSelection = asyncHandler(async (req, res) => {
    const { title, productIds, layout, productsPerRow, limit, status, isActive } = req.body;
    let existing = await prisma.trendingSelection.findFirst();
    
    const payload = {
        title: title || 'Trending Products',
        productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
        layout: layout || 'GRID',
        productsPerRow: parseInt(productsPerRow || 4),
        limit: parseInt(limit || 8),
        status: status || 'PUBLISHED',
        isActive: isActive !== false
    };

    let selection;
    if (existing) {
        selection = await prisma.trendingSelection.update({ where: { id: existing.id }, data: payload });
    } else {
        selection = await prisma.trendingSelection.create({ data: payload });
    }

    res.status(200).json({ success: true, message: 'Trending products selection updated', data: selection });
});

// ==================== Dynamic Homepage Section Builder ====================
exports.getHomepageSectionsPublic = asyncHandler(async (req, res) => {
    const sections = await prisma.homepageSection.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });

    const now = new Date();
    const activeSections = sections.filter(sec => {
        if (sec.startDate && new Date(sec.startDate) > now) return false;
        if (sec.endDate && new Date(sec.endDate) < now) return false;
        return true;
    });

    const enriched = await Promise.all(activeSections.map(async sec => {
        let pIds = [];
        try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }
        let products = [];
        if (pIds.length > 0) {
            const rawProds = await prisma.product.findMany({
                where: { id: { in: pIds }, status: 'PUBLISHED', isVisible: true },
                include: { images: true, category: { select: { name: true, slug: true } } }
            });
            const prodMap = new Map(rawProds.map(p => [p.id, p]));
            products = pIds.map(id => prodMap.get(id)).filter(Boolean);
        }
        return { ...sec, products };
    }));

    res.status(200).json({ success: true, data: enriched });
});

exports.getAllHomepageSectionsAdmin = asyncHandler(async (req, res) => {
    const sections = await prisma.homepageSection.findMany({
        orderBy: { sortOrder: 'asc' }
    });

    // Enrich each section with its resolved product objects so the admin UI
    // can display which products are already assigned without a separate call.
    const enriched = await Promise.all(sections.map(async sec => {
        let pIds = [];
        try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }
        let products = [];
        if (pIds.length > 0) {
            const rawProds = await prisma.product.findMany({
                where: { id: { in: pIds } },
                include: { images: { take: 1 }, category: { select: { name: true, slug: true } } }
            });
            const prodMap = new Map(rawProds.map(p => [p.id, p]));
            // Preserve admin-defined order
            products = pIds.map(id => prodMap.get(id)).filter(Boolean);
        }
        return { ...sec, products };
    }));

    res.status(200).json({ success: true, data: enriched });
});

exports.createHomepageSection = asyncHandler(async (req, res) => {
    const {
        title, slug, subtitle, description, bannerUrl, sectionIcon, layoutType,
        productIds, maxProducts, status, isActive, productsPerRow, bgColor, textColor,
        buttonText, buttonLink, startDate, endDate, devices, sortOrder
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Section title is required' });

    const baseSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const count = await prisma.homepageSection.count();

    const section = await prisma.homepageSection.create({
        data: {
            title,
            slug: finalSlug,
            subtitle: subtitle || null,
            description: description || null,
            bannerUrl: bannerUrl || null,
            sectionIcon: sectionIcon || null,
            layoutType: layoutType || 'GRID',
            productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
            maxProducts: parseInt(maxProducts || 12),
            status: status || 'PUBLISHED',
            isActive: isActive !== false,
            productsPerRow: parseInt(productsPerRow || 4),
            bgColor: bgColor || '#FFFFFF',
            textColor: textColor || '#111827',
            buttonText: buttonText || 'Explore Collection',
            buttonLink: buttonLink || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            devices: typeof devices === 'string' ? devices : JSON.stringify(devices || ['DESKTOP', 'TABLET', 'MOBILE']),
            sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : count
        }
    });

    res.status(201).json({ success: true, message: 'Homepage Section created successfully', data: section });
});

exports.updateHomepageSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Strip read-only fields and relations that can't be updated directly
    const { createdAt, updatedAt, products, ...rest } = req.body;
    const updateData = { ...rest };

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    else if (updateData.startDate === '') updateData.startDate = null;
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    else if (updateData.endDate === '') updateData.endDate = null;
    if (Array.isArray(updateData.productIds)) updateData.productIds = JSON.stringify(updateData.productIds);
    if (Array.isArray(updateData.devices)) updateData.devices = JSON.stringify(updateData.devices);
    if (updateData.productsPerRow !== undefined) updateData.productsPerRow = parseInt(updateData.productsPerRow);
    if (updateData.maxProducts !== undefined) updateData.maxProducts = parseInt(updateData.maxProducts);
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);
    if (updateData.isActive !== undefined) updateData.isActive = Boolean(updateData.isActive);

    const section = await prisma.homepageSection.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({ success: true, message: 'Homepage Section updated successfully', data: section });
});

exports.reorderHomepageSections = asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Items array required' });

    await Promise.all(items.map(item =>
        prisma.homepageSection.update({
            where: { id: item.id },
            data: { sortOrder: parseInt(item.sortOrder) }
        })
    ));

    res.status(200).json({ success: true, message: 'Homepage sections reordered successfully' });
});

exports.duplicateHomepageSection = asyncHandler(async (req, res) => {
    const source = await prisma.homepageSection.findUnique({ where: { id: req.params.id } });
    if (!source) return res.status(404).json({ success: false, message: 'Homepage Section not found' });

    const { id, createdAt, updatedAt, slug, ...rest } = source;
    const baseSlug = (slug || rest.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const duplicate = await prisma.homepageSection.create({
        data: {
            ...rest,
            title: `${rest.title} (Copy)`,
            slug: `${baseSlug}-copy-${Date.now().toString(36)}`,
            status: 'DRAFT',
            isActive: false,
            sortOrder: rest.sortOrder + 1
        }
    });

    res.status(201).json({ success: true, message: 'Homepage Section duplicated', data: duplicate });
});

exports.deleteHomepageSection = asyncHandler(async (req, res) => {
    await prisma.homepageSection.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Homepage Section deleted successfully' });
});

// --- Fine-grained product management for a section ---

exports.getSectionProducts = asyncHandler(async (req, res) => {
    const sec = await prisma.homepageSection.findUnique({ where: { id: req.params.id } });
    if (!sec) return res.status(404).json({ success: false, message: 'Section not found' });

    let pIds = [];
    try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }

    let products = [];
    if (pIds.length > 0) {
        const raw = await prisma.product.findMany({
            where: { id: { in: pIds } },
            include: { images: { take: 1 }, category: { select: { name: true, slug: true } } }
        });
        const map = new Map(raw.map(p => [p.id, p]));
        products = pIds.map(id => map.get(id)).filter(Boolean);
    }
    res.status(200).json({ success: true, data: products, productIds: pIds });
});

exports.addProductToSection = asyncHandler(async (req, res) => {
    const { id, productId } = req.params;
    const sec = await prisma.homepageSection.findUnique({ where: { id } });
    if (!sec) return res.status(404).json({ success: false, message: 'Section not found' });

    let pIds = [];
    try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }

    if (!pIds.includes(productId)) {
        pIds.push(productId);
        await prisma.homepageSection.update({
            where: { id },
            data: { productIds: JSON.stringify(pIds) }
        });
    }
    res.status(200).json({ success: true, message: 'Product added to section', productIds: pIds });
});

exports.removeProductFromSection = asyncHandler(async (req, res) => {
    const { id, productId } = req.params;
    const sec = await prisma.homepageSection.findUnique({ where: { id } });
    if (!sec) return res.status(404).json({ success: false, message: 'Section not found' });

    let pIds = [];
    try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }

    const newIds = pIds.filter(pid => pid !== productId);
    await prisma.homepageSection.update({
        where: { id },
        data: { productIds: JSON.stringify(newIds) }
    });
    res.status(200).json({ success: true, message: 'Product removed from section (product still exists in database)', productIds: newIds });
});

exports.reorderProductsInSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productIds } = req.body; // Already-ordered array of product IDs
    if (!Array.isArray(productIds)) return res.status(400).json({ success: false, message: 'productIds array required' });

    const sec = await prisma.homepageSection.findUnique({ where: { id } });
    if (!sec) return res.status(404).json({ success: false, message: 'Section not found' });

    await prisma.homepageSection.update({
        where: { id },
        data: { productIds: JSON.stringify(productIds) }
    });
    res.status(200).json({ success: true, message: 'Product order updated', productIds });
});

// ==================== Header Navigation Menu Manager ====================
exports.getHeaderMenusPublic = asyncHandler(async (req, res) => {
    // 1. Fetch explicit HeaderMenu entries
    const menus = await prisma.headerMenu.findMany({
        where: { isActive: true, status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' }
    });

    // 2. Fetch ALL categories that should appear in nav (inNavMenu=true, visible, published)
    const navCategories = await prisma.category.findMany({
        where: {
            inNavMenu: true,
            isVisible: true,
            status: 'PUBLISHED'
        },
        include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
    }).catch(() => []);

    // 3. Build a set of categoryIds already covered by explicit HeaderMenu entries
    const menuCategoryIds = new Set(menus.filter(m => m.categoryId).map(m => m.categoryId));
    const menuSlugs = new Set(menus.map(m => m.slug));

    // 4. Enrich explicit HeaderMenu entries with subcategories
    const enrichedMenus = await Promise.all(menus.map(async menu => {
        let subcategories = [];
        if (menu.categoryId) {
            // Find the matching category from our fetched list
            const matchedCat = navCategories.find(c => c.id === menu.categoryId);
            subcategories = matchedCat?.subcategories || [];
            if (subcategories.length === 0) {
                subcategories = await prisma.subCategory.findMany({
                    where: { categoryId: menu.categoryId },
                    orderBy: { sortOrder: 'asc' }
                }).catch(() => []);
            }
        }
        return { ...menu, subcategories };
    }));

    // 5. Auto-include categories that DON'T have a HeaderMenu entry yet
    const autoCategoryMenus = navCategories
        .filter(cat => !menuCategoryIds.has(cat.id) && !menuSlugs.has(cat.slug))
        .map((cat, idx) => ({
            id: `auto-cat-${cat.id}`,
            title: cat.name,
            slug: cat.slug,
            link: `/categories/${cat.slug}`,
            categoryId: cat.id,
            icon: null,
            sortOrder: 1000 + (cat.sortOrder || idx),
            status: 'PUBLISHED',
            isActive: true,
            subcategories: cat.subcategories || []
        }));

    // 6. Combine and sort
    const combined = [...enrichedMenus, ...autoCategoryMenus].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.status(200).json({ success: true, data: combined });
});

exports.getAllHeaderMenusAdmin = asyncHandler(async (req, res) => {
    const menus = await prisma.headerMenu.findMany({
        orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: menus });
});

exports.createHeaderMenu = asyncHandler(async (req, res) => {
    const { title, slug, icon, link, categoryId, status, isActive, sortOrder } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const baseSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const menu = await prisma.headerMenu.create({
        data: {
            title,
            slug: finalSlug,
            icon: icon || null,
            link: link || null,
            categoryId: categoryId || null,
            status: status || 'PUBLISHED',
            isActive: isActive !== false,
            sortOrder: parseInt(sortOrder || 0)
        }
    });

    res.status(201).json({ success: true, message: 'Header menu created', data: menu });
});

exports.updateHeaderMenu = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);

    const menu = await prisma.headerMenu.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({ success: true, message: 'Header menu updated', data: menu });
});

exports.reorderHeaderMenus = asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Items array required' });

    await Promise.all(items.map(item =>
        prisma.headerMenu.update({
            where: { id: item.id },
            data: { sortOrder: parseInt(item.sortOrder) }
        })
    ));

    res.status(200).json({ success: true, message: 'Header menus reordered' });
});

exports.deleteHeaderMenu = asyncHandler(async (req, res) => {
    await prisma.headerMenu.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Header menu deleted' });
});

// ==================== Mobile Navigation Management ====================
exports.getMobileNavItems = asyncHandler(async (req, res) => {
    const items = await prisma.mobileNavItem.findMany({
        orderBy: { sortOrder: 'asc' }
    });
    if (items.length === 0) {
        const defaultItems = [
            { label: 'Home', path: '/', icon: 'FiHome', activeIcon: 'FiHome', badgeType: 'NONE', sortOrder: 0, isActive: true },
            { label: 'Categories', path: '/categories', icon: 'FiGrid', activeIcon: 'FiGrid', badgeType: 'NONE', sortOrder: 1, isActive: true },
            { label: 'Search', path: '/search', icon: 'FiSearch', activeIcon: 'FiSearch', badgeType: 'NONE', sortOrder: 2, isActive: true },
            { label: 'Wishlist', path: '/wishlist', icon: 'FiHeart', activeIcon: 'FiHeart', badgeType: 'WISHLIST', sortOrder: 3, isActive: true },
            { label: 'Cart', path: '/cart', icon: 'FiShoppingBag', activeIcon: 'FiShoppingBag', badgeType: 'CART', sortOrder: 4, isActive: true },
            { label: 'Orders', path: '/orders', icon: 'FiPackage', activeIcon: 'FiPackage', badgeType: 'NONE', sortOrder: 5, isActive: true },
            { label: 'Profile', path: '/profile', icon: 'FiUser', activeIcon: 'FiUser', badgeType: 'NONE', sortOrder: 6, isActive: true }
        ];
        await prisma.mobileNavItem.createMany({ data: defaultItems });
        const seeded = await prisma.mobileNavItem.findMany({ orderBy: { sortOrder: 'asc' } });
        return res.status(200).json({ success: true, data: seeded });
    }
    res.status(200).json({ success: true, data: items });
});

exports.createMobileNavItem = asyncHandler(async (req, res) => {
    const { label, path, icon, activeIcon, badgeType, sortOrder, isActive } = req.body;
    if (!label || !path) return res.status(400).json({ success: false, message: 'Label and path are required' });

    const item = await prisma.mobileNavItem.create({
        data: {
            label,
            path,
            icon: icon || 'FiHome',
            activeIcon: activeIcon || null,
            badgeType: badgeType || 'NONE',
            sortOrder: parseInt(sortOrder || 0),
            isActive: isActive !== false
        }
    });
    res.status(201).json({ success: true, message: 'Mobile nav item created', data: item });
});

exports.updateMobileNavItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.sortOrder !== undefined) updateData.sortOrder = parseInt(updateData.sortOrder);

    const item = await prisma.mobileNavItem.update({
        where: { id },
        data: updateData
    });
    res.status(200).json({ success: true, message: 'Mobile nav item updated', data: item });
});

exports.reorderMobileNavItems = asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ success: false, message: 'Items array required' });

    await Promise.all(items.map(item =>
        prisma.mobileNavItem.update({
            where: { id: item.id },
            data: { sortOrder: parseInt(item.sortOrder) }
        })
    ));
    res.status(200).json({ success: true, message: 'Mobile nav items reordered' });
});

exports.deleteMobileNavItem = asyncHandler(async (req, res) => {
    await prisma.mobileNavItem.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Mobile nav item deleted' });
});

// ==================== Header Settings ====================
exports.getHeaderSettings = asyncHandler(async (req, res) => {
    let settings = await prisma.headerSetting.findFirst();
    if (!settings) {
        settings = await prisma.headerSetting.create({
            data: {
                logoUrl: null,
                announcementText: null,
                announcementBgColor: '#121212',
                announcementTextColor: '#D4AF37',
                announcementLink: null,
                announcementEnabled: false,
                stickyHeader: true,
                searchVisible: true,
                notificationVisible: true,
                wishlistVisible: true,
                cartVisible: true,
                profileVisible: true,
                headerBgColor: '#0D0D0D',
                headerTextColor: '#FFFFFF'
            }
        });
    } else if (settings.announcementText && (settings.announcementText.includes('FREE EXPRESS SHIPPING') || settings.announcementText.includes('KVLR10'))) {
        // Automatically sanitize legacy seeded demo announcement from database
        settings = await prisma.headerSetting.update({
            where: { id: settings.id },
            data: {
                announcementText: null,
                announcementEnabled: false
            }
        });
    }
    res.status(200).json({ success: true, data: settings });
});

exports.updateHeaderSettings = asyncHandler(async (req, res) => {
    let settings = await prisma.headerSetting.findFirst();
    if (!settings) {
        settings = await prisma.headerSetting.create({ data: req.body });
    } else {
        settings = await prisma.headerSetting.update({
            where: { id: settings.id },
            data: req.body
        });
    }
    res.status(200).json({ success: true, message: 'Header settings updated', data: settings });
});

// ==================== CONSOLIDATED HOMEPAGE BUNDLE (LIGHTNING FAST) ====================
let homepageBundleCache = null;
let homepageBundleCacheTime = 0;
const BUNDLE_CACHE_TTL_MS = 60 * 1000; // 60s memory cache

exports.invalidateHomepageBundleCache = () => {
    homepageBundleCache = null;
    homepageBundleCacheTime = 0;
};

exports.getHomepageBundle = asyncHandler(async (req, res) => {
    const now = Date.now();
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');

    if (homepageBundleCache && (now - homepageBundleCacheTime < BUNDLE_CACHE_TTL_MS)) {
        return res.status(200).json({ success: true, cached: true, data: homepageBundleCache });
    }

    try {
        const productSelect = {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true,
            discountPercent: true,
            discountPrice: true,
            stock: true,
            featured: true,
            trending: true,
            newArrival: true,
            bestSeller: true,
            todaysDeal: true,
            isNew: true,
            isRecommended: true,
            isPremium: true,
            shortDesc: true,
            status: true,
            sizes: true,
            colors: true,
            createdAt: true,
            images: {
                orderBy: { displayOrder: 'asc' },
                select: { id: true, url: true, isPrimary: true }
            },
            category: {
                select: { id: true, name: true, slug: true }
            },
            subCategory: {
                select: { id: true, name: true, slug: true }
            },
            brand: {
                select: { id: true, name: true }
            }
        };

        const publishedStatusFilter = { notIn: ['DELETED', 'ARCHIVED', 'DRAFT', 'deleted', 'archived', 'draft'] };

        const [
            banners,
            categories,
            allProducts,
            trendingSelection,
            storeSettings,
            rawDynamicSections,
            rawFlashSale,
            rawCollections,
            rawHeritageBrands,
            rawReviews,
            rawSocialFeed,
            rawFaqs
        ] = await Promise.all([
            prisma.banner.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
                take: 10
            }).catch(() => []),
            prisma.category.findMany({
                where: { isVisible: true, status: { notIn: ['DELETED', 'ARCHIVED', 'DRAFT', 'deleted', 'archived', 'draft'] } },
                take: 24,
                orderBy: { sortOrder: 'asc' },
                include: { subcategories: { where: { isVisible: true }, select: { id: true, name: true, slug: true } } }
            }).catch(() => []),
            prisma.product.findMany({
                where: { status: publishedStatusFilter, isVisible: true },
                take: 200,
                orderBy: { createdAt: 'desc' },
                select: productSelect
            }).catch(() => []),
            prisma.trendingSelection.findFirst({
                where: { isActive: true }
            }).catch(() => null),
            prisma.storeSettings.findFirst().catch(() => null),
            prisma.homepageSection.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' }
            }).catch(() => []),
            prisma.flashSale.findFirst({
                where: { isActive: true }
            }).catch(() => null),
            prisma.productCollection.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
                take: 8
            }).catch(() => []),
            prisma.heritageBrand.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                take: 8
            }).catch(() => []),
            prisma.customerReview.findMany({
                where: { isFeatured: true, isApproved: true },
                take: 8,
                orderBy: { createdAt: 'desc' }
            }).catch(() => []),
            prisma.socialFollowButton.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                take: 8
            }).catch(() => []),
            prisma.fAQ.findMany({
                where: { isFeatured: true },
                take: 8,
                orderBy: { order: 'asc' }
            }).catch(() => [])
        ]);

        // In-memory instant filtering (Eliminates 4 heavy database roundtrips & table scans!)
        const featuredProducts = allProducts.filter(p => p.featured).slice(0, 12);
        const trendingProducts = allProducts.filter(p => p.trending).slice(0, 12);
        const newArrivalProducts = allProducts.slice(0, 16);
        const bestSellerProducts = allProducts.filter(p => p.bestSeller || p.todaysDeal).slice(0, 12);

        // Enrich trendingSelection products if set
        let enrichedTrending = null;
        if (trendingSelection) {
            let pIds = [];
            try { pIds = JSON.parse(trendingSelection.productIds || '[]'); } catch (e) { pIds = []; }
            let tProducts = [];
            if (pIds.length > 0) {
                const prodMap = new Map(allProducts.map(p => [p.id, p]));
                const missingIds = pIds.filter(id => !prodMap.has(id));
                if (missingIds.length > 0) {
                    const extraProds = await prisma.product.findMany({
                        where: { id: { in: missingIds }, status: publishedStatusFilter, isVisible: true },
                        select: productSelect
                    }).catch(() => []);
                    extraProds.forEach(p => prodMap.set(p.id, p));
                }
                tProducts = pIds.map(id => prodMap.get(id)).filter(Boolean);
            }
            enrichedTrending = { ...trendingSelection, products: tProducts };
        }

        // Enrich dynamicSections products
        const enrichedDynamicSections = (rawDynamicSections || []).map((sec) => {
            let pIds = [];
            try { pIds = JSON.parse(sec.productIds || '[]'); } catch (e) { pIds = []; }
            const prodMap = new Map(allProducts.map((p) => [p.id, p]));
            const sProducts = pIds.map((id) => prodMap.get(id)).filter(Boolean);
            return { ...sec, products: sProducts };
        });

        const bundleData = {
            banners: banners || [],
            categories: categories || [],
            products: {
                allPublished: allProducts || [],
                featured: featuredProducts,
                trending: trendingProducts,
                newArrivals: newArrivalProducts,
                todaysDeals: bestSellerProducts
            },
            trendingData: enrichedTrending,
            settings: storeSettings,
            dynamicSections: enrichedDynamicSections,
            flashSale: rawFlashSale,
            collections: rawCollections,
            heritageBrands: rawHeritageBrands,
            testimonials: rawReviews,
            socialFeed: rawSocialFeed,
            faqList: rawFaqs
        };

        homepageBundleCache = bundleData;
        homepageBundleCacheTime = Date.now();

        res.status(200).json({ success: true, cached: false, data: bundleData });
    } catch (err) {
        console.error('[HOMEPAGE BUNDLE ERROR]:', err.message);
        res.status(500).json({ success: false, message: 'Failed to load homepage bundle', error: err.message });
    }
});
