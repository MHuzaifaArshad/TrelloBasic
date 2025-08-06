// backend/routes/notificationRoutes.js
const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); 

router.route('/')
  .get(getNotifications); 

router.route('/:id/read')
  .put(markNotificationAsRead); 

router.route('/mark-all-read')
  .put(markAllNotificationsAsRead); 

module.exports = router;