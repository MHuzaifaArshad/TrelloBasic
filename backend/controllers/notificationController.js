// backend/controllers/notificationController.js
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { getIo } = require('../utils/socket'); 

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username') 
      .populate('project', 'name') 
      .populate('task', 'title') 
      .sort({ createdAt: -1 }); 

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid notification ID format' });
  }

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    
    if (!notification.recipient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to mark this notification as read' });
    }

    notification.isRead = true;
    await notification.save();

    
    const io = getIo();
    io.to(req.user._id.toString()).emit('notificationUpdated', notification);

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
};

// @desc    Mark all notifications for the authenticated user as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    // Emit update to the user's socket room to reflect all as read
    const io = getIo();
    io.to(req.user._id.toString()).emit('allNotificationsRead'); 

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error marking all notifications as read' });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};