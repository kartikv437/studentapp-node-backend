const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/submit-application', authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      phoneNumber,
      gender,
    } = req.body;

    const application = new Application({
      userId: req.user.id, 
      fullName,
      dateOfBirth,
      phoneNumber,
      gender,
    });
    await application.save();

    return res.json({
      message: 'Application submitted successfully',
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting application',
      error: error.message,
    });
  }
});

// controllers/applicationController.js
router.put('/update-application', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're using JWT
    const updatedData = req.body;

    const updatedApplication = await Application.findOneAndUpdate(
      { userId },
      updatedData,
      { new: true, upsert: false } // upsert: false = don't create new
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ message: "Application updated successfully", data: updatedApplication });
  } catch (err) {
    res.status(500).json({ message: "Error updating application", error: err.message });
  }
});


router.get('/my-applications', authMiddleware, async (req, res) => {
  console.log(req.user.id);
  const applications = await Application.findOne({userId:req.user.id});  
  console.log(applications);
  
  res.json(applications);
});

module.exports = router;
