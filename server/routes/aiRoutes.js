const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/suggestions', aiController.getSearchSuggestions);
router.get('/recommendations/:productId', aiController.getRecommendations);
router.post('/back-in-stock', aiController.subscribeBackInStock);
router.get('/admin/search-analytics', aiController.getSearchAnalytics);

module.exports = router;
