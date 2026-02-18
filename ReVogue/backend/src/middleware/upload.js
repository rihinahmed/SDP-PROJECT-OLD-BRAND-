// /backend/src/middleware/upload.js - COMPLETE VERSION

const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const path = require('path');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Middleware to upload to Supabase Storage
const uploadToSupabase = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        console.log('=== UPLOADING TO SUPABASE STORAGE ===');
        console.log('File:', req.file.originalname);
        console.log('Size:', req.file.size);
        console.log('Type:', req.file.mimetype);

        const userId = req.user.id;
        
        // Generate unique filename
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExt}`;
        const filePath = `avatars/${fileName}`;

        console.log('Uploading to path:', filePath);

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from('profile-pictures')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        console.log('Upload successful:', data);

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        console.log('Public URL:', publicUrl);

        // Add the URL to the request object
        req.file.cloudUrl = publicUrl;
        req.file.storagePath = filePath;

        console.log('✅ File uploaded to Supabase Storage successfully');

        next();
    } catch (error) {
        console.error('Upload to Supabase error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload file'
        });
    }
};

// Export both multer instance and middleware
module.exports = {
    single: (fieldName) => {
        return [
            upload.single(fieldName),
            uploadToSupabase
        ];
    },
    upload
};