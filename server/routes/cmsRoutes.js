const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ── Public endpoints ──────────────────────────────────────────
// Public endpoints
router.get('/settings', cmsController.getStoreSettings);
router.get('/announcements', cmsController.getAnnouncements);
router.get('/banners', cmsController.getBanners);
router.get('/flash-sale', cmsController.getFlashSale);
router.get('/special-deals/public', cmsController.getSpecialDealsPublic);
router.get('/collections/public', cmsController.getCollectionsPublic);
router.get('/reviews/public', cmsController.getReviewsPublic);
router.get('/social-follow/public', cmsController.getSocialFollowPublic);
router.get('/heritage-brands/public', cmsController.getHeritageBrandsPublic);
router.get('/trending-selection/public', cmsController.getTrendingSelectionPublic);
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

// Customer Reviews Admin Routes
router.get('/reviews/admin/all', ...adminOnly, cmsController.getAllReviewsAdmin);
router.post('/reviews', ...adminOnly, cmsController.createReview);
router.put('/reviews/:id', ...adminOnly, cmsController.updateReview);
router.post('/reviews/:id/duplicate', ...adminOnly, cmsController.duplicateReview);
router.delete('/reviews/:id', ...adminOnly, cmsController.deleteReview);

// Social Media Follow Admin Routes
router.get('/social-follow/admin/all', ...adminOnly, cmsController.getAllSocialFollowAdmin);
router.post('/social-follow', ...adminOnly, cmsController.createSocialFollow);
router.put('/social-follow/:id', ...adminOnly, cmsController.updateSocialFollow);
router.post('/social-follow/:id/duplicate', ...adminOnly, cmsController.duplicateSocialFollow);
router.delete('/social-follow/:id', ...adminOnly, cmsController.deleteSocialFollow);

// Heritage Brands Admin Routes
router.get('/heritage-brands/admin/all', ...adminOnly, cmsController.getAllHeritageBrandsAdmin);
router.post('/heritage-brands', ...adminOnly, cmsController.createHeritageBrand);
router.put('/heritage-brands/:id', ...adminOnly, cmsController.updateHeritageBrand);
router.post('/heritage-brands/:id/duplicate', ...adminOnly, cmsController.duplicateHeritageBrand);
router.delete('/heritage-brands/:id', ...adminOnly, cmsController.deleteHeritageBrand);

// Trending Products Selection Admin Routes
router.get('/trending-selection/admin', ...adminOnly, cmsController.getTrendingSelectionAdmin);
router.put('/trending-selection/admin', ...adminOnly, cmsController.updateTrendingSelection);

// Flash Sale Admin Routes
router.get('/flash-sales/admin/all', ...adminOnly, cmsController.getAllFlashSalesAdmin);
router.post('/flash-sale', ...adminOnly, cmsController.createFlashSale);
router.post('/flash-sales', ...adminOnly, cmsController.createFlashSale);
router.put('/flash-sales/:id', ...adminOnly, cmsController.updateFlashSale);
router.post('/flash-sales/:id/duplicate', ...adminOnly, cmsController.duplicateFlashSale);
router.delete('/flash-sales/:id', ...adminOnly, cmsController.deleteFlashSale);

// Special Deals Admin Routes
router.get('/special-deals/admin/all', ...adminOnly, cmsController.getAllSpecialDealsAdmin);
router.post('/special-deals', ...adminOnly, cmsController.createSpecialDeal);
router.put('/special-deals/:id', ...adminOnly, cmsController.updateSpecialDeal);
router.post('/special-deals/:id/duplicate', ...adminOnly, cmsController.duplicateSpecialDeal);
router.delete('/special-deals/:id', ...adminOnly, cmsController.deleteSpecialDeal);

// Product Collections Admin Routes
router.get('/collections/admin/all', ...adminOnly, cmsController.getAllCollectionsAdmin);
router.post('/collections', ...adminOnly, cmsController.createCollection);
router.put('/collections/:id', ...adminOnly, cmsController.updateCollection);
router.post('/collections/:id/duplicate', ...adminOnly, cmsController.duplicateCollection);
router.delete('/collections/:id', ...adminOnly, cmsController.deleteCollection);

router.get('/homepage/admin/all', ...adminOnly, cmsController.getAllHomepageSectionsAdmin);
router.post('/homepage/sections', ...adminOnly, cmsController.createHomepageSection);
router.put('/homepage/sections/reorder', ...adminOnly, cmsController.reorderHomepageSections);
router.put('/homepage/sections/:id', ...adminOnly, cmsController.updateHomepageSection);
router.post('/homepage/sections/:id/duplicate', ...adminOnly, cmsController.duplicateHomepageSection);
router.delete('/homepage/sections/:id', ...adminOnly, cmsController.deleteHomepageSection);
router.put('/homepage', ...adminOnly, cmsController.updateHomepageSections);
router.get('/pages/admin/all', ...adminOnly, cmsController.getAllCMSPages);
router.put('/pages/:slug', ...adminOnly, cmsController.updateCMSPage);
router.post('/pages', ...adminOnly, cmsController.createCMSPage);
router.post('/pages/:slug/duplicate', ...adminOnly, cmsController.duplicateCMSPage);
router.delete('/pages/:slug', ...adminOnly, cmsController.deleteCMSPage);
router.post('/faqs', ...adminOnly, cmsController.createFAQ);
router.put('/faqs/:id', ...adminOnly, cmsController.updateFAQ);
router.delete('/faqs/:id', ...adminOnly, cmsController.deleteFAQ);
router.get('/contact/admin/messages', ...adminOnly, cmsController.adminGetContactMessages);
router.put('/contact/messages/:id/read', ...adminOnly, cmsController.markContactMessageRead);
router.delete('/contact/messages/:id', ...adminOnly, cmsController.deleteContactMessage);
router.get('/newsletter/admin/subscribers', ...adminOnly, cmsController.adminGetNewsletterSubscribers);
router.delete('/newsletter/subscribers/:id', ...adminOnly, cmsController.deleteNewsletterSubscriber);

module.exports = router;

