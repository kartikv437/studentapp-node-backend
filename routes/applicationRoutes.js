const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

router.post('/submit', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;
        const application = new Application({
            firstName,
            lastName,
            email,
            phoneNumber,
        });
        await application.save();
        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
});

router.get('/applications', async (req, res) => {
    try {
        const applications = await Application.find();
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});
module.exports = router;
