const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    let resource_type = 'raw';
    let folder = 'slms_materials/files';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext)) {
      resource_type = 'image';
      folder = ext === 'pdf' ? 'slms_materials/docs' : 'slms_materials/images';
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
      resource_type = 'video';
      folder = 'slms_materials/videos';
    }

    // Generate unique name and preserve extensions for raw assets so they download with extensions
    const baseName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = resource_type === 'raw' 
      ? `${baseName}_${Date.now()}.${ext}` 
      : `${baseName}_${Date.now()}`;

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: publicId
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

module.exports = {
  cloudinary,
  upload
};
