const multer = require('multer');
const path = require('path');

// Memory storage keeps file buffers in memory for direct Cloudinary upload without Railway disk dependencies
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
  ];
  const mime = (file.mimetype || '').toLowerCase();

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    const error = new Error('Only JPG, JPEG, PNG, and WEBP image formats are supported.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;

