require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

/**
 * Clean environment variable strings:
 * Removes leading/trailing whitespace, linebreaks, and accidental surrounding quotes.
 */
const cleanEnvVar = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

const getCloudName = () => cleanEnvVar(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME);
const getApiKey = () => cleanEnvVar(process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY);
const getApiSecret = () => cleanEnvVar(process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET);
const getCloudinaryUrl = () => cleanEnvVar(process.env.CLOUDINARY_URL);

/**
 * Checks whether Cloudinary credentials are fully provided and valid.
 */
const isCloudinaryConfigured = () => {
  if (getCloudinaryUrl()) {
    return true;
  }
  const name = getCloudName();
  const key = getApiKey();
  const secret = getApiSecret();
  return Boolean(name && key && secret);
};

/**
 * Applies active configuration to the Cloudinary v2 SDK.
 */
const applyCloudinaryConfig = () => {
  const url = getCloudinaryUrl();
  if (url) {
    cloudinary.config({
      cloudinary_url: url,
      secure: true,
    });
    return;
  }

  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: getCloudName(),
      api_key: getApiKey(),
      api_secret: getApiSecret(),
      secure: true,
    });
  }
};

/**
 * Safe status helper for logs and health checks.
 * NEVER returns or prints the API secret.
 */
const getCloudinaryStatus = () => {
  const cloudName = getCloudName();
  const apiKey = getApiKey();
  const apiSecret = getApiSecret();
  const url = getCloudinaryUrl();

  return {
    configured: Boolean(url || (cloudName && apiKey && apiSecret)),
    hasCloudName: Boolean(cloudName),
    cloudNameMasked: cloudName ? `${cloudName.substring(0, 3)}***` : 'missing',
    hasApiKey: Boolean(apiKey),
    hasApiSecret: Boolean(apiSecret),
    hasCloudinaryUrl: Boolean(url),
  };
};

// Initial setup on module load
if (isCloudinaryConfigured()) {
  applyCloudinaryConfig();
  console.log('[Cloudinary] Configured successfully with cloud name:', getCloudName() ? `${getCloudName().substring(0, 3)}***` : '(via CLOUDINARY_URL)');
} else {
  console.log('[Storage] Cloudinary environment variables missing or incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway.');
}

/**
 * Streams an in-memory buffer directly to Cloudinary.
 * Avoids temporary disk files and ephemeral filesystem dependencies on Railway.
 */
const uploadToCloudinary = (fileBuffer, folder = 'rocoware/complaints') => {
  return new Promise((resolve, reject) => {
    // Refresh configuration with active environment variables before check
    applyCloudinaryConfig();

    if (!isCloudinaryConfigured()) {
      const err = new Error(
        'Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway environment variables.'
      );
      err.statusCode = 500;
      err.code = 'CLOUDINARY_NOT_CONFIGURED';
      console.error('[Image Upload] Upload failed: Cloudinary credentials missing or incomplete on Railway backend');
      return reject(err);
    }

    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      const err = new Error('Invalid or empty file buffer provided for image upload.');
      err.statusCode = 400;
      console.error('[Image Upload] Upload failed: Invalid file buffer received');
      return reject(err);
    }

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
        console.log('[Image Upload] Public ID:', result.public_id);
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
  applyCloudinaryConfig,
  getCloudinaryStatus,
  uploadToCloudinary,
  deleteFromCloudinary,
};
