const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ensureStoreSettingsSchema } = require('./cmsController');

// Public: Get Store Settings
exports.getSettings = asyncHandler(async (req, res) => {
  try {
    let settings;
    try {
      settings = await prisma.storeSettings.findFirst();
    } catch (dbErr) {
      await ensureStoreSettingsSchema();
      settings = await prisma.storeSettings.findFirst();
    }

    if (!settings) {
      await ensureStoreSettingsSchema();
      settings = await prisma.storeSettings.create({ data: { id: 'default' } });
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.warn('[SETTINGS] Database fallback:', err.message);
    return res.status(200).json({
      success: true,
      data: {
        id: 'default',
        storeName: 'StyleVerse',
        storeTagline: 'Enterprise Luxury Clothing & Jewellery Platform',
        currencySymbol: '₹',
        primaryColor: '#D4AF37',
        secondaryColor: '#1A1A1A',
        contactEmail: 'support@styleverse.com',
        contactPhone: '+91 98765 43210',
        address: '123 Fashion Street, Cyber City, Hyderabad, India',
        whatsappNumber: '919876543210',
        whatsappEnabled: true,
        whatsappBusinessName: 'StyleVerse',
        whatsappWorkingHours: 'Mon-Sat 9AM-7PM',
        whatsappAutoReply: 'Thank you for contacting us! We will respond within 24 hours.'
      }
    });
  }
});

// Admin: Update Store Settings
exports.updateSettings = asyncHandler(async (req, res) => {
  try {
    await ensureStoreSettingsSchema();
    let existing = await prisma.storeSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: req.body,
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: { id: 'default', ...req.body },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Store settings and configurations saved successfully in database!',
      data: settings,
    });
  } catch (err) {
    console.error('[SETTINGS UPDATE ERROR]:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to save store settings',
    });
  }
});
