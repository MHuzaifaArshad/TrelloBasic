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
      enum: ['To Do', 'In Progress', 'Done'], 
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
    project: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Project', 
    },
    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId,
      required: false, 
      ref: 'User', 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        filePath: { 
          type: String,
          required: true,
        },
        mimetype: { 
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
    timestamps: true, 
  }
);

taskSchema.index({ project: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;