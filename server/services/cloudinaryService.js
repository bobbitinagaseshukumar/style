const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const fs = require('fs');

const uploadImage = async (fileBuffer, folder = 'styleverse') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(new ApiError(500, "Error uploading image to Cloudinary"));
                }
                resolve({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
        );
        uploadStream.end(fileBuffer);
    });
};

const deleteImage = async (public_id) => {
    try {
        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new ApiError(500, "Error deleting image from Cloudinary");
    }
};

const uploadMultipleImages = async (filesBufferArray, folder = 'styleverse') => {
    try {
        const uploadPromises = filesBufferArray.map((buffer) => uploadImage(buffer, folder));
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        throw new ApiError(500, "Error uploading multiple images");
    }
};

module.exports = {
    uploadImage,
    deleteImage,
    uploadMultipleImages
};
