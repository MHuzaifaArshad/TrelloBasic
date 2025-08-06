// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const Chat = require('../models/ChatModel');


 //route   GET /api/projects/:projectId/chat
 //@desc    Get all chat messages for a specific project
 //@access  Private

router.get('/projects/:projectId/chat', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const messages = await Chat.find({ projectId })
      .populate('sender', 'username') 
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server error while fetching messages.' });
  }
});

module.exports = router;
