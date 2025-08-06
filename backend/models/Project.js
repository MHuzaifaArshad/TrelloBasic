// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false, 
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
      ref: 'User', 
    },
    members: [ 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
      },
    ],
  },
  {
    timestamps: true, 
  }
);


projectSchema.index({ name: 1, owner: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
