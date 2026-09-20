const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage: cloudinaryStorage } = require('../config/cloudinary');

// Memory storage for temporary files (cloud compatible)

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.match(/\.(xlsx|xls|csv)$/)) {
        cb(null, true);
    } else {
        cb(new Error('Only images, PDFs, PPTs, and Excel/CSV files are allowed'), false);
    }
};

// Default upload (Cloudinary)
const upload = multer({
    storage: cloudinaryStorage,
    fileFilter
});

// Temp upload (Disk) - used for bulk uploads that are processed and deleted
const tempUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter
});

module.exports = upload;
module.exports.tempUpload = tempUpload;

