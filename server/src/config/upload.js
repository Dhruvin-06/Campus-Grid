const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── PDF/Document Storage ──────────────────────────────────────────────────────
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const origName = file.originalname || 'document';
    const ext = origName.includes('.') ? origName.split('.').pop() : 'pdf';
    const baseName = origName.substring(0, origName.lastIndexOf('.')) || 'file';
    const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

    return {
      folder: 'campusgrid/resources',
      resource_type: 'raw',
      public_id: `${cleanName}_${Date.now()}.${ext}`,
    };
  },
});

// ─── Image Storage ─────────────────────────────────────────────────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusgrid/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
  },
});

// ─── Avatar Storage ────────────────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusgrid/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes}`), false);
  }
};

// Multer instances
const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(/image\/(jpeg|png|webp|gif)/),
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: fileFilter(/image\/(jpeg|png|webp)/),
});

module.exports = { uploadDocument, uploadImage, uploadAvatar, cloudinary };
