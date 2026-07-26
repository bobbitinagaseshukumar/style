const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ── Public endpoints ──────────────────────────────────────────
router.get('/settings', cmsController.getStoreSettings);
router.get('/announcements', cmsController.getAnnouncements);
router.get('/banners', cmsController.getBanners);
router.get('/flash-sale', cmsController.getFlashSale);
router.get('/brands', cmsController.getBrands);
router.get('/testimonials', cmsController.getTestimonials);
router.get('/instagram', cmsController.getInstagramPosts);
router.get('/homepage', cmsController.getHomepageSections);
router.get('/pages/:slug', cmsController.getCMSPage);
router.get('/faqs', cmsController.getFAQs);

// Public contact & newsletter
router.post('/contact', cmsController.submitContactMessage);
router.post('/newsletter/subscribe', cmsController.subscribeNewsletter);

// ── Admin-only endpoints ──────────────────────────────────────
const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

router.put('/settings', ...adminOnly, cmsController.updateStoreSettings);
router.post('/announcements', ...adminOnly, cmsController.createAnnouncement);
router.put('/announcements/:id', ...adminOnly, cmsController.updateAnnouncement);
router.delete('/announcements/:id', ...adminOnly, cmsController.deleteAnnouncement);
router.get('/banners/stats', ...adminOnly, cmsController.getBannerStats);
router.post('/banners', ...adminOnly, cmsController.createBanner);
router.put('/banners/:id', ...adminOnly, cmsController.updateBanner);
router.post('/banners/:id/duplicate', ...adminOnly, cmsController.duplicateBanner);
router.delete('/banners/:id', ...adminOnly, cmsController.deleteBanner);
router.post('/banners/:id/view', cmsController.trackBannerView);
router.post('/banners/:id/click', cmsController.trackBannerClick);
router.post('/flash-sale', ...adminOnly, cmsController.createFlashSale);
router.get('/homepage/admin/all', ...adminOnly, cmsController.getAllHomepageSectionsAdmin);
router.post('/homepage/sections', ...adminOnly, cmsController.createHomepageSection);
router.put('/homepage/sections/reorder', ...adminOnly, cmsController.reorderHomepageSections);
router.put('/homepage/sections/:id', ...adminOnly, cmsController.updateHomepageSection);
router.post('/homepage/sections/:id/duplicate', ...adminOnly, cmsController.duplicateHomepageSection);
router.delete('/homepage/sections/:id', ...adminOnly, cmsController.deleteHomepageSection);
router.put('/homepage', ...adminOnly, cmsController.updateHomepageSections);
router.put('/pages/:slug', ...adminOnly, cmsController.updateCMSPage);
router.post('/faqs', ...adminOnly, cmsController.createFAQ);
router.put('/faqs/:id', ...adminOnly, cmsController.updateFAQ);
router.delete('/faqs/:id', ...adminOnly, cmsController.deleteFAQ);
router.get('/contact/admin/messages', ...adminOnly, cmsController.adminGetContactMessages);
router.get('/newsletter/admin/subscribers', ...adminOnly, cmsController.adminGetNewsletterSubscribers);

module.exports = router;
