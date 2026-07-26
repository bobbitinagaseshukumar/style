const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

router.get('/stats', ...adminOnly, adminDashboardController.getDashboardStats);

module.exports = router;
