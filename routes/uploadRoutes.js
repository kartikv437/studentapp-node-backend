const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const uploadsPath = path.join(__dirname, '..', 'uploads'); 
const StudentDocuments = require('../models/StudentDocuments');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

// Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Ensure this folder exists
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });


if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ uploads folder created at:', uploadsPath);
} else {
    console.log('✅ uploads folder already exists at:', uploadsPath);
}

const upload = multer({ storage });

// Helper to upload a buffer to cloudinary
const uploadToCloudinary = (fileBuffer, originalname, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder,
                    resource_type: 'auto',
                    public_id: originalname.split('.')[0],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            )
            .end(fileBuffer);
    });
};

router.post('/upload', upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'tenth', maxCount: 1 },
    { name: 'twelfth', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
]), async (req, res) => {
    try {
        const documentData = {};
        for (const fieldName in req.files) {
            const file = req.files[fieldName][0];
            const result = await uploadToCloudinary(file.buffer, file.originalname, 'student-docs');

            documentData[fieldName] = {
                resourceType: result.resource_type,
                createdAt: result.created_at,
                fileType: result.format,
                path: result.url,
                fileUrl: result.secure_url,
                displayName: file.originalname,
            };
        }

        // Optional: Add studentId if you're tracking user
        const savedDocument = new StudentDocuments({
            ...documentData,
            studentId: req.body.studentId || 'unknown',
        });

        await savedDocument.save();
        res.status(200).json({ message: 'All documents uploaded', data: savedDocument });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
});

router.get('/getDocs', async (req, res) => {

    try {
        const files = await StudentDocuments.find();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }
        res.status(200).json(files);
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
            error: err.message,
            stack: err.stack,
        });
    }
});

module.exports = router;
