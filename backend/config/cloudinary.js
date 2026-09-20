const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'hackathon_portal/others';
    let resource_type = 'auto'; // Automatically detect image vs raw (PDF/PPT/etc)

    if (req.user && req.user.role === 'student') {
      const safeName = req.user.name ? req.user.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Student';
      const regNo = req.user.registerNo ? req.user.registerNo.replace(/[^a-zA-Z0-9]/g, '') : 'NoReg';
      folder = `hackathon_portal/students/${safeName}_${regNo}`;
    } else if (file.fieldname === 'poster') {
      folder = 'hackathon_portal/admin/posters';
    }

    return {
      folder: folder,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9]/g, '_')}`,
    };
  },
});

module.exports = { cloudinary, storage };
