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

// ==================== STREAMING CHAT (SSE) ====================
exports.handleStreamMessage = async (req, res) => {
  const { message, sessionId, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }
  if (message.trim().length > 2000) {
    return res.status(400).json({ success: false, message: 'Message too long (max 2000 characters)' });
  }

  const user = req.user || null;
  const sessId = sessionId || `session_${Date.now()}`;

  // Log conversation
  let conversation;
  try {
    conversation = await prisma.chatbotConversation.findFirst({
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

    // Save user message
    await prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        text: message.trim()
      }
    });
  } catch (dbErr) {
    console.error('[Chatbot Stream] DB error:', dbErr.message);
    // Continue even if DB logging fails — the chat should still work
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Handle client disconnect
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const result = await chatbotService.processStreamQuery({
      query: message,
      user,
      sessionId: sessId,
      history: history || [],
      onChunk: (text) => {
        // Send each text chunk as an SSE event
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
      },
      signal: abortController.signal,
    });

    if (result.streamed) {
      // AI streaming completed — send done event with metadata
      res.write(`data: ${JSON.stringify({
        type: 'done',
        aiPowered: true,
        actions: [
          { label: '🔍 Find a Product', action: 'SEARCH_PRODUCT' },
          { label: '👨‍💻 Human Support', action: 'ESCALATE' }
        ]
      })}\n\n`);

      // Save the full AI response to DB
      if (conversation) {
        try {
          await prisma.chatbotMessage.create({
            data: {
              conversationId: conversation.id,
              sender: 'BOT',
              text: result.fullResponse || '',
              metadata: JSON.stringify({ type: 'AI_RESPONSE', aiPowered: true })
            }
          });
        } catch (dbErr) {
          console.error('[Chatbot Stream] DB save error:', dbErr.message);
        }
      }
    } else {
      // Intent matched — send structured data as a single SSE event
      res.write(`data: ${JSON.stringify({
        type: 'structured',
        data: result.data
      })}\n\n`);

      // Save bot message to DB
      if (conversation && result.data) {
        try {
          await prisma.chatbotMessage.create({
            data: {
              conversationId: conversation.id,
              sender: 'BOT',
              text: result.data.reply || '',
              metadata: JSON.stringify(result.data)
            }
          });
        } catch (dbErr) {
          console.error('[Chatbot Stream] DB save error:', dbErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[Chatbot Stream] Error:', err.message);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'I apologize, something went wrong. Please try again.'
    })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

// ==================== AI STATUS (ADMIN) ====================
exports.getAIStatus = asyncHandler(async (req, res) => {
  const status = await chatbotService.getAIStatus();
  res.status(200).json({ success: true, data: status });
});
