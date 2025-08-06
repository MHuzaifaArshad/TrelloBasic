// backend/models/ChatModel.js
const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // This MUST match the name of your User model
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;