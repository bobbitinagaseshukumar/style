const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const chatbotService = require('../services/chatbotService');

// ==================== PROCESS CHATBOT MESSAGE ====================
exports.handleMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const user = req.user || null;
  const sessId = sessionId || `session_${Date.now()}`;

  // Log or find conversation
  let conversation = await prisma.chatbotConversation.findFirst({
    where: { sessionId: sessId },
    orderBy: { createdAt: 'desc' }
  });

  if (!conversation) {
    conversation = await prisma.chatbotConversation.create({
      data: {
        sessionId: sessId,
        userId: user ? user.id : null,
        status: 'ACTIVE'
      }
    });
  }

  // Save User Message
  await prisma.chatbotMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'USER',
      text: message.trim()
    }
  });

  // Process Query via Chatbot Service
  const botResponse = await chatbotService.processQuery({
    query: message,
    user,
    sessionId: sessId
  });

  // Save Bot Message
  await prisma.chatbotMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'BOT',
      text: botResponse.reply,
      metadata: JSON.stringify(botResponse)
    }
  });

  res.status(200).json({
    success: true,
    data: botResponse,
    conversationId: conversation.id,
    sessionId: sessId
  });
});

// ==================== ESCALATE TO SUPPORT TICKET ====================
exports.escalateToSupport = asyncHandler(async (req, res) => {
  const { sessionId, reason } = req.body;
  const user = req.user || null;

  const result = await chatbotService.escalateToSupport({
    user,
    sessionId: sessionId || 'session',
    query: reason || 'Customer requested human support escalation'
  });

  res.status(200).json({ success: true, data: result });
});

// ==================== ADMIN CHATBOT ANALYTICS ====================
exports.getAdminAnalytics = asyncHandler(async (req, res) => {
  const totalConversations = await prisma.chatbotConversation.count();
  const activeConversations = await prisma.chatbotConversation.count({ where: { status: 'ACTIVE' } });
  const escalatedConversations = await prisma.chatbotConversation.count({ where: { status: 'ESCALATED' } });
  const totalMessages = await prisma.chatbotMessage.count();

  const recentConversations = await prisma.chatbotConversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  res.status(200).json({
    success: true,
    data: {
      totalConversations,
      activeConversations,
      escalatedConversations,
      totalMessages,
      recentConversations
    }
  });
});
