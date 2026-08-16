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

    const raw = req.body || {};
    const sanitizedData = {};

    // Only allow known string fields through
    const stringFields = [
      'storeName', 'storeTagline', 'logoUrl', 'faviconUrl', 'contactEmail', 'contactPhone',
      'alternatePhone', 'supportEmail', 'address', 'googleMapsLink', 'businessHours',
      'currencySymbol', 'language', 'timeZone', 'primaryColor', 'secondaryColor',
      'estimatedDeliveryDays', 'whatsappNumber', 'whatsappBusinessName', 'whatsappWorkingHours',
      'whatsappAutoReply', 'whatsappCountryCode', 'whatsappDefaultMessage', 'whatsappGreeting',
      'whatsappThankYou', 'instagramUrl', 'facebookUrl', 'youtubeUrl', 'twitterUrl',
      'telegramUrl', 'pinterestUrl', 'linkedinUrl', 'footerDescription', 'copyrightText',
      'footerQuickLinks', 'metaTitle', 'metaDescription', 'metaKeywords', 'ogImageUrl', 'robotsTxt'
    ];
    stringFields.forEach(f => {
      if (raw[f] !== undefined) {
        sanitizedData[f] = typeof raw[f] === 'string' ? raw[f].trim() : String(raw[f] || '');
      }
    });

    // Boolean fields
    const boolFields = ['maintenanceMode', 'whatsappEnabled', 'showPaymentIcons', 'showTrustBadges',
      'isCODEnabled', 'isRazorpayEnabled', 'isStripeEnabled', 'isCashfreeEnabled'];
    boolFields.forEach(f => {
      if (raw[f] !== undefined) {
        sanitizedData[f] = raw[f] === true || raw[f] === 'true' || raw[f] === 1 || raw[f] === '1';
      }
    });

    // Number fields
    if (raw.shippingFee !== undefined || raw.shippingCharge !== undefined) {
      const val = parseFloat(raw.shippingFee !== undefined ? raw.shippingFee : raw.shippingCharge) || 0;
      sanitizedData.shippingFee = val;
      sanitizedData.shippingCharge = val;
    }
    if (raw.freeShippingThreshold !== undefined) {
      sanitizedData.freeShippingThreshold = parseFloat(raw.freeShippingThreshold) || 0;
    }

    let existing = await prisma.storeSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.storeSettings.update({
        where: { id: existing.id },
        data: sanitizedData,
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: { id: 'default', ...sanitizedData },
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
