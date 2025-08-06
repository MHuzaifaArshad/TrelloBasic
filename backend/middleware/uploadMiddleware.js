// backend/middleware/uploadMiddleware.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env

// --- NEW: Debugging logs for Cloudinary credentials ---
console.log('Cloudinary Config Check:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Loaded' : 'NOT LOADED');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Loaded' : 'NOT LOADED');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'NOT LOADED');
// --- END Debugging logs ---

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'collaboration-tool-uploads',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'],
  },
  filename: (req, file, cb) => {
    const originalnameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
    cb(null, `${originalnameWithoutExt}-${Date.now()}`);
  }
});

module.exports = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 },
});