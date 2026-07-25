const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/tickets', supportController.createTicket);
router.get('/my-tickets', supportController.getMyTickets);
router.post('/tickets/:id/reply', supportController.replyTicket);
router.get('/admin/tickets', authorize('ADMIN', 'SUPER_ADMIN'), supportController.adminGetTickets);
router.put('/admin/tickets/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), supportController.adminUpdateTicketStatus);

module.exports = router;
