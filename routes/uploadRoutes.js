const express = require('express');

const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const StudentDocuments = require('../models/StudentDocuments');

// Helper to upload a buffer to cloudinary
const uploadToCloudinary = (fileBuffer, originalname, folder = 'student-docs') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',
                public_id: originalname.split('.')[0]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(fileBuffer);
    });
};

// router.post('/upload', upload.fields([
//     { name: 'aadhar', maxCount: 1 },
//     { name: 'tenth', maxCount: 1 },
//     { name: 'twelfth', maxCount: 1 },
//     { name: 'degree', maxCount: 1 },
//     { name: 'photo', maxCount: 1 },
// ]), async (req, res) => {
//     console.log('Received files:', req.files); // 💡

//     try {
//         const documentData = {};
//         if (!req.files || Object.keys(req.files).length === 0) {
//             return res.status(400).json({ message: 'No files uploaded' });
//         }

//         for (const fieldName of Object.keys(req.files)) {
//             console.log(`Processing field: ${fieldName}`); // 💡

//             if (!req.files[fieldName] || req.files[fieldName].length === 0) {
//                 return res.status(400).json({ message: `No file uploaded for ${fieldName}` });
//             }
//             if (req.files[fieldName]) {
//                 const file = req.files[fieldName][0];
//                 const result = await uploadToCloudinary(file.buffer, file.originalname, 'student-docs');
//                 documentData[fieldName] = {
//                     resourceType: result.resource_type,
//                     createdAt: result.created_at,
//                     fileType: result.format,
//                     path: result.url,
//                     fileUrl: result.secure_url,
//                     displayName: file.originalname,
//                 };
//             }
//         }

//         const savedDocument = new StudentDocuments({
//             ...documentData,
//             studentId: req.body.studentId || 'unknown',
//         });

//         await savedDocument.save();
//         res.status(200).json({ message: 'All documents uploaded', data: savedDocument });
//     } catch (err) {
//         console.error('Cloudinary upload or DB save error:', err); // 💡
//         res.status(500).json({ message: 'Upload failed', error: err.message });
//     }
// });

router.post(
    '/upload',
    upload.fields([
        { name: 'aadhar', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
        { name: 'tenth', maxCount: 1 },
        { name: 'twelfth', maxCount: 1 },
        { name: 'degree', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const documentData = {};

            // Loop through each uploaded file field
            for (const fieldName in req.files) {
                const file = req.files[fieldName][0];
                const result = await uploadToCloudinary(file.buffer, file.originalname);
                console.log(`Uploaded ${fieldName}:`, result); // Debugging log
                
                documentData[fieldName] = {
                    url: result.secure_url,
                    fileType: result.format,
                    uploadedAt: result.created_at,
                    resourceType: result.resource_type,
                    createdAt: result.created_at,
                    fileUrl: result.secure_url,
                    displayName: file.display_name,
                };
            }

            const savedDocument = new StudentDocuments({
                ...documentData,
                studentId: req.body.studentId || 'unknown',
            });

            await savedDocument.save();
            res.status(200).json({
                message: 'Documents uploaded successfully',
                documents: documentData
            });
        } catch (error) {
            res.status(500).json({ message: 'Upload failed', error: error.message });
        }
    }
);

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
