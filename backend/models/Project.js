// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false, // Not globally unique, but unique per owner
      trim: true,
    },
    description: {
      type: String,
      required: false,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // References the User model
    },
    members: [ // Array of user IDs who are members of the project
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
      },
    ],
  },
  {
    timestamps: true, // Mongoose automatically adds `createdAt` and `updatedAt` fields
  }
);

// Add a unique compound index to ensure a user cannot have two projects with the exact same name
projectSchema.index({ name: 1, owner: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
