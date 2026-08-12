const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// Ensure uploads/products directory exists
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload single image (Cloudinary with Local Disk Fallback)
exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No image file provided.'));
  }

  console.log(`[IMAGE UPLOAD] Processing file: ${req.file.originalname}, Size: ${req.file.size} bytes`);

  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const isRealCloudinary = cloudName && cloudName !== 'demo' && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_KEY !== 'demo';

  // 1. Attempt Cloudinary Upload if valid keys exist
  if (isRealCloudinary) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'styleverse/products',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
            transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
          },
          (error, res) => {
            if (error) reject(error);
            else resolve(res);
          }
        );
        stream.end(req.file.buffer);
      });

      console.log(`[IMAGE UPLOAD SUCCESS - CLOUDINARY] URL: ${result.secure_url}`);
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully to Cloudinary.',
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      console.warn('[CLOUDINARY UPLOAD FAILED - FALLING BACK TO LOCAL DISK]', err.message);
    }
  }

  // 2. Local Disk Storage Fallback (Guarantees zero upload failures)
  try {
    const ext = path.extname(req.file.originalname) || '.webp';
    const filename = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    const relativeUrl = `/uploads/products/${filename}`;
    console.log(`[IMAGE UPLOAD SUCCESS - LOCAL DISK] Saved: ${relativeUrl}`);

    return res.status(200).json({
      success: true,
      message: 'Image saved to server local storage successfully.',
      url: relativeUrl,
      publicId: filename,
    });
  } catch (localErr) {
    console.error('[LOCAL DISK SAVE FAILED]', localErr);
    return next(new ApiError(500, 'Failed to save uploaded image.'));
  }
});
