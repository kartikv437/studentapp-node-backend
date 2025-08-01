const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET chat history between logged-in user and another user
router.get('/:receiverId', async (req, res) => {
  try {
    const senderId = req.userId; 
    const receiverId = req.params.receiverId;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort('timestamp');

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
});

module.exports = router;
