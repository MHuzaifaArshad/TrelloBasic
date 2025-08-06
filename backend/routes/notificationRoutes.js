// backend/routes/notificationRoutes.js
const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/')
  .get(getNotifications); // Get all notifications for the authenticated user

router.route('/:id/read')
  .put(markNotificationAsRead); // Mark a specific notification as read

router.route('/mark-all-read')
  .put(markAllNotificationsAsRead); // Mark all notifications for the user as read

module.exports = router;