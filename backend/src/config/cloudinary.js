const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const isCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim()) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME.trim() &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY.trim() &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET.trim()
  );
};

const applyCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim()) {
    cloudinary.config();
    return;
  }

  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    });
  }
};

// Initial setup on module load
if (isCloudinaryConfigured()) {
  applyCloudinaryConfig();
  console.log('[Cloudinary] Configured successfully with cloud name:', process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME.trim() : '(via CLOUDINARY_URL)');
} else {
  console.log('[Storage] Cloudinary environment variables missing or incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway.');
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

    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      const err = new Error('Invalid or empty file buffer provided for image upload.');
      err.statusCode = 400;
      console.error('[Image Upload] Upload failed: Invalid file buffer received');
      return reject(err);
    }

    // Refresh configuration with active environment variables
    applyCloudinaryConfig();

    console.log(`[Image Upload] Starting Cloudinary upload (${fileBuffer.length} bytes) to folder: ${folder}`);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Image Upload] Cloudinary upload error:', error.message || error);
          const uploadErr = new Error(error.message || 'Failed to upload image to Cloudinary.');
          uploadErr.statusCode = error.http_code || 500;
          return reject(uploadErr);
        }
        if (!result || !result.secure_url) {
          console.error('[Image Upload] Cloudinary returned no secure_url');
          const noUrlErr = new Error('Cloudinary did not return a valid secure URL.');
          noUrlErr.statusCode = 500;
          return reject(noUrlErr);
        }
        console.log('[Image Upload] Cloudinary upload successful');
        console.log('[Image Upload] URL:', result.secure_url);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.on('error', (streamErr) => {
      console.error('[Image Upload Stream Error]', streamErr.message || streamErr);
      reject(streamErr);
    });

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    applyCloudinaryConfig();
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

