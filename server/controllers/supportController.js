const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Protect: Create support ticket
exports.createTicket = asyncHandler(async (req, res, next) => {
  const { subject, category, priority, message } = req.body;

  if (!subject || !message) {
    return next(new ApiError(400, 'Subject and Message are required'));
  }

  const ticketNo = 'TICK-' + Math.floor(100000 + Math.random() * 900000);

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo,
      userId: req.user.id,
      subject,
      category: category || 'General',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      messages: {
        create: {
          senderRole: 'CUSTOMER',
          senderName: req.user.fullName,
          message,
        },
      },
    },
    include: { messages: true },
  });

  res.status(201).json({
    success: true,
    message: `Support ticket ${ticketNo} created successfully!`,
    data: ticket,
  });
});

// Protect: Get customer tickets
exports.getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user.id },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: tickets });
});

// Protect: Add message thread reply
exports.replyTicket = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) return next(new ApiError(400, 'Message cannot be empty'));

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return next(new ApiError(404, 'Ticket not found'));

  const reply = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderRole: req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' ? 'SUPPORT' : 'CUSTOMER',
      senderName: req.user.fullName,
      message,
    },
  });

  res.status(201).json({ success: true, data: reply });
});

// Admin: Get all tickets
exports.adminGetTickets = asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    include: { user: { select: { fullName: true, email: true } }, messages: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: tickets });
});

// Admin: Update ticket status
exports.adminUpdateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
  });

  res.status(200).json({ success: true, message: `Ticket status set to ${status}`, data: ticket });
});
