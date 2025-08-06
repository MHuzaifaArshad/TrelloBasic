// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: { // Optional: who triggered the notification (e.g., user who updated task)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    project: { // Optional: which project the notification relates to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    task: { // Optional: which task the notification relates to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false,
    },
    type: { // e.g., 'task_assigned', 'task_status_change', 'new_message', 'project_member_added'
      type: String,
      required: true,
      enum: ['task_assigned', 'task_status_change', 'new_message', 'project_member_added', 'task_created', 'task_deleted', 'task_updated', 'task_unassigned'], // Added task_unassigned
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Index to quickly query notifications for a specific user, ordered by creation date
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;