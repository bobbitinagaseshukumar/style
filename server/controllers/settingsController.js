const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Public: Get Store Settings
exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: { id: 'default' } });
  }
  res.status(200).json({ success: true, data: settings });
});

// Admin: Update Store Settings
exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: req.body,
    create: { id: 'default', ...req.body },
  });

  res.status(200).json({
    success: true,
    message: 'Store settings and configurations saved successfully!',
    data: settings,
  });
});
