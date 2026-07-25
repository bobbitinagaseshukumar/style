const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// Public: Vendor application
router.post('/vendor-register', marketplaceController.registerVendor);

// Public: View branches
router.get('/branches', marketplaceController.getBranches);

// Admin-only endpoints
router.get('/admin/vendors', ...adminOnly, marketplaceController.adminGetVendors);
router.put('/admin/vendors/:id/status', ...adminOnly, marketplaceController.adminUpdateVendorStatus);
router.get('/admin/payouts', ...adminOnly, marketplaceController.adminGetPayouts);

// Authenticated vendor: payout request
router.post('/payouts', protect, marketplaceController.requestPayout);

// Admin-only: Create branches
router.post('/branches', ...adminOnly, marketplaceController.createBranch);

module.exports = router;
