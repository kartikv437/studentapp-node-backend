const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/submit-application',authMiddleware, async (req, res) => {
    try {
        const {
            fullName,
            dateOfBirth,
            email,
            phoneNumber,
            gender,
        } = req.body;
        const application = new Application({
            fullName,
            dateOfBirth,
            email,
            phoneNumber,
            gender,
        });
        await application.save();
        res.status(201).json(
            {
                message: 'Application submitted successfully',
                status: 'success',
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
});

router.get('/get-applications', async (req, res) => {
    try {
        const applications = await Application.find();
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});
module.exports = router;
