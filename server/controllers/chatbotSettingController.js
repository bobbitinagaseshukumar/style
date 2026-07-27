const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// ==================== GET CHATBOT SETTINGS ====================
exports.getChatbotSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.chatbotSetting.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.chatbotSetting.create({
      data: {
        id: 'default',
        isEnabled: true,
        showOnMobile: true,
        showOnDesktop: true,
        position: 'bottom-right',
        bottomOffset: 24,
        rightOffset: 24,
        theme: 'dark',
        welcomeMessage: "👋 Hello! Welcome to KVLR Styles. I'm your 24/7 AI Shopping Assistant. How can I help you today?",
        autoOpenDelay: 0,
        hideOnCheckout: true
      }
    });
  }

  res.status(200).json({ success: true, data: settings });
});

// ==================== UPDATE CHATBOT SETTINGS (ADMIN) ====================
exports.updateChatbotSettings = asyncHandler(async (req, res) => {
  const {
    isEnabled, showOnMobile, showOnDesktop, position,
    bottomOffset, rightOffset, theme, welcomeMessage,
    autoOpenDelay, hideOnCheckout
  } = req.body;

  const settings = await prisma.chatbotSetting.upsert({
    where: { id: 'default' },
    update: {
      ...(isEnabled !== undefined && { isEnabled }),
      ...(showOnMobile !== undefined && { showOnMobile }),
      ...(showOnDesktop !== undefined && { showOnDesktop }),
      ...(position && { position }),
      ...(bottomOffset !== undefined && { bottomOffset: parseInt(bottomOffset) }),
      ...(rightOffset !== undefined && { rightOffset: parseInt(rightOffset) }),
      ...(theme && { theme }),
      ...(welcomeMessage && { welcomeMessage }),
      ...(autoOpenDelay !== undefined && { autoOpenDelay: parseInt(autoOpenDelay) }),
      ...(hideOnCheckout !== undefined && { hideOnCheckout })
    },
    create: {
      id: 'default',
      isEnabled: isEnabled ?? true,
      showOnMobile: showOnMobile ?? true,
      showOnDesktop: showOnDesktop ?? true,
      position: position || 'bottom-right',
      bottomOffset: bottomOffset || 24,
      rightOffset: rightOffset || 24,
      theme: theme || 'dark',
      welcomeMessage: welcomeMessage || "👋 Hello! Welcome to KVLR Styles. How can I help you today?",
      autoOpenDelay: autoOpenDelay || 0,
      hideOnCheckout: hideOnCheckout ?? true
    }
  });

  res.status(200).json({ success: true, message: 'Chatbot settings updated successfully', data: settings });
});
