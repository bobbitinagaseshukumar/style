const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

// ==================== GET CAMPAIGNS ====================
exports.getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { logs: true } } }
  });
  res.status(200).json({ success: true, data: campaigns });
});

// ==================== CREATE CAMPAIGN ====================
exports.createCampaign = asyncHandler(async (req, res) => {
  const {
    title, subject, bannerImage, description, buttonText, buttonUrl,
    campaignType, targetAudience, targetCategory, productIds,
    publishDate, expiryDate, status, isFeatured
  } = req.body;

  if (!title || !subject || !description) {
    return res.status(400).json({ success: false, message: 'Title, subject, and description are required' });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      title,
      subject,
      bannerImage: bannerImage || null,
      description,
      buttonText: buttonText || 'Explore Now',
      buttonUrl: buttonUrl || '/offers',
      campaignType: campaignType || 'PROMOTIONAL',
      targetAudience: targetAudience || 'ALL',
      targetCategory: targetCategory || null,
      productIds: typeof productIds === 'string' ? productIds : JSON.stringify(productIds || []),
      publishDate: publishDate ? new Date(publishDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: status || 'DRAFT',
      isFeatured: Boolean(isFeatured),
    }
  });

  res.status(201).json({ success: true, message: 'Email campaign created', data: campaign });
});

// ==================== UPDATE CAMPAIGN ====================
exports.updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  if (updateData.productIds && typeof updateData.productIds !== 'string') {
    updateData.productIds = JSON.stringify(updateData.productIds);
  }

  const campaign = await prisma.emailCampaign.update({
    where: { id },
    data: updateData
  });

  res.status(200).json({ success: true, message: 'Campaign updated', data: campaign });
});

// ==================== SEND CAMPAIGN NOW ====================
exports.sendCampaignNow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

  // Resolve target audience recipients
  let recipients = [];
  if (campaign.targetAudience === 'NEWSLETTER') {
    const subs = await prisma.newsletterSubscriber.findMany({ where: { isActive: true }, select: { email: true } });
    recipients = subs.map(s => s.email);
  } else {
    // Default to customers who have email notifications enabled
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER', emailNotifications: true, status: 'ACTIVE' },
      select: { email: true }
    });
    recipients = users.map(u => u.email);
  }

  if (recipients.length === 0) {
    return res.status(400).json({ success: false, message: 'No recipients match target audience criteria' });
  }

  // Fetch featured products if any
  let products = [];
  try {
    const pIds = JSON.parse(campaign.productIds || '[]');
    if (pIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: pIds } },
        include: { images: true }
      });
    }
  } catch (err) {}

  const result = await emailService.sendCampaign({
    campaignId: campaign.id,
    subject: campaign.subject,
    recipients,
    headline: campaign.title,
    description: campaign.description,
    bannerImage: campaign.bannerImage,
    products,
    buttonText: campaign.buttonText,
    buttonUrl: campaign.buttonUrl,
  });

  res.status(200).json({
    success: true,
    message: `Campaign sent to ${recipients.length} customers successfully`,
    data: result
  });
});

// ==================== DELETE CAMPAIGN ====================
exports.deleteCampaign = asyncHandler(async (req, res) => {
  await prisma.emailCampaign.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: 'Campaign deleted' });
});

// ==================== GET EMAIL HISTORY & STATS ====================
exports.getEmailHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const logs = await prisma.emailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: parseInt(limit),
    skip,
    include: { campaign: { select: { title: true, campaignType: true } } }
  });

  const total = await prisma.emailLog.count();

  res.status(200).json({
    success: true,
    data: { logs, total, page: parseInt(page), limit: parseInt(limit) }
  });
});

// ==================== NEWSLETTER SUBSCRIBE ====================
exports.subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email address is required' });
  }

  const normalized = email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });

  if (existing) {
    if (!existing.isActive) {
      await prisma.newsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    return res.status(200).json({ success: true, message: 'Thank you for subscribing to StyleVerse newsletter!' });
  }

  await prisma.newsletterSubscriber.create({ data: { email: normalized } });
  res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter!' });
});

// ==================== UPDATE NOTIFICATION PREFERENCES ====================
exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { preferences } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: typeof preferences === 'string' ? preferences : JSON.stringify(preferences || {})
    },
    select: { id: true, notificationPreferences: true }
  });

  res.status(200).json({ success: true, message: 'Notification preferences updated', data: updatedUser });
});
