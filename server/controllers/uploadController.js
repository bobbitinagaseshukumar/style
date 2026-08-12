const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Upload single image to Cloudinary
exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No image file provided.'));
  }

  console.log(`[IMAGE UPLOAD] Received file: ${req.file.originalname}, Size: ${req.file.size} bytes`);

  // Upload buffer to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'styleverse/products',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) {
          console.error('[IMAGE UPLOAD ERROR]', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(req.file.buffer);
  });

  console.log(`[IMAGE UPLOAD SUCCESS] URL: ${result.secure_url}`);

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully.',
    url: result.secure_url,
    publicId: result.public_id,
  });
});
