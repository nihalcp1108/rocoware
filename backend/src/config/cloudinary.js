const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] Configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[Storage] Cloudinary environment variables missing or incomplete.');
}

const uploadToCloudinary = (fileBuffer, folder = 'rocoware/complaints') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      const err = new Error(
        'Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway environment variables.'
      );
      err.statusCode = 500;
      console.error('[Image Upload] Upload failed: Cloudinary credentials missing on Railway backend');
      return reject(err);
    }

    // Ensure Cloudinary is initialized with current process.env
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('[Image Upload] Starting Cloudinary upload');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Image Upload] Upload failed:', error.message);
          return reject(error);
        }
        console.log('[Image Upload] Cloudinary upload successful');
        console.log('[Image Upload] URL:', result.secure_url);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary] Deleted image:', publicId);
  } catch (err) {
    console.warn('[Cloudinary Delete Warning]', err.message);
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};

