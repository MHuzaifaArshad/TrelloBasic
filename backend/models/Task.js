// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'], // Kanban-style statuses
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      required: false,
    },
    project: { // The project this task belongs to
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Project', // References the 'Project' model
    },
    assignedTo: { // The user assigned to this task
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Task might not be assigned initially
      ref: 'User', // References the 'User' model
    },
    createdBy: { // The user who created this task
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // NEW: Field for attachments
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        filePath: { // This will store the local path or cloud URL
          type: String,
          required: true,
        },
        mimetype: { // Store the file type
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add a compound index for efficient querying of tasks within a project
taskSchema.index({ project: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;