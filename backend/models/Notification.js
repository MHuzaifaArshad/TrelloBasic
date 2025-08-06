// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    project: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    task: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false,
    },
    type: { 
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
    timestamps: true, 
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;