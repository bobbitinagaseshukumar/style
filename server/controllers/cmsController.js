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
    const banners = await prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    res.status(200).json({ success: true, data: banners });
});

exports.createBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, imageUrl, linkUrl, type, sortOrder, isActive } = req.body;
    const banner = await prisma.banner.create({
        data: { title, subtitle, imageUrl, linkUrl, type: type || 'HERO_SLIDER', sortOrder: parseInt(sortOrder || 0), isActive: isActive !== false }
    });
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
});

exports.updateBanner = asyncHandler(async (req, res) => {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    res.status(200).json({ success: true, message: 'Banner updated', data: banner });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Banner deleted' });
});

// ==================== Flash Sales ====================
exports.getFlashSale = asyncHandler(async (req, res) => {
    const flashSale = await prisma.flashSale.findFirst({
        where: { isActive: true, endTime: { gte: new Date() } },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: flashSale });
});

exports.createFlashSale = asyncHandler(async (req, res) => {
    const flashSale = await prisma.flashSale.create({ data: req.body });
    res.status(201).json({ success: true, message: 'Flash sale created', data: flashSale });
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
exports.getCMSPage = asyncHandler(async (req, res, next) => {
    const page = await prisma.cMSPage.findUnique({ where: { slug: req.params.slug } });
    if (!page) return next(new ApiError(404, 'Page not found'));
    res.status(200).json({ success: true, data: page });
});

exports.updateCMSPage = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const slug = req.params.slug;
    
    const page = await prisma.cMSPage.upsert({
        where: { slug },
        update: { title, content },
        create: { title: title || slug, slug, content: content || '' }
    });
    
    res.status(200).json({ success: true, message: 'Page updated', data: page });
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
