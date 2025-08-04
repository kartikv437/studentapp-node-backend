const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');

router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } });
  res.json(users);
});

router.get('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const application = await Application.findOne({ userId: req.params.id });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
   
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User deleted successfully.', statusCode: 200 });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting user.', error: err.message });
  }
});

module.exports = router;