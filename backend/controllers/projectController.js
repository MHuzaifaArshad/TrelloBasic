// backend/controllers/projectController.js
const Project = require('../models/Project'); // Import the Project model
const User = require('../models/User');     // Import User model for member validation
const Task = require('../models/Task');     // Import Task model for aggregation
const mongoose = require('mongoose');       // Import mongoose to check for valid ObjectId

// @desc    Get all projects for the authenticated user (owner or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // Find projects where the authenticated user is either the owner or a member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id }, // User is the owner
        { members: req.user._id } // User is a member
      ]
    })
    .populate('owner', 'username email') // Populate owner details (username, email)
    .populate('members', 'username email'); // Populate members details

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  try {
    // Find project by ID and populate owner and members
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if the authenticated user is the owner or a member of the project
    const isAuthorized = project.owner.equals(req.user._id) || project.members.some(member => member.equals(req.user._id));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// Helper function to convert usernames to user IDs
async function getUserIdsFromUsernames(usernames) {
  if (!usernames || usernames.length === 0) {
    return [];
  }
  const users = await User.find({ username: { $in: usernames } });
  const foundUsernames = new Set(users.map(u => u.username));
  const notFoundUsernames = usernames.filter(un => !foundUsernames.has(un));

  if (notFoundUsernames.length > 0) {
    throw new Error(`User(s) not found: ${notFoundUsernames.join(', ')}`);
  }
  return users.map(user => user._id);
}

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  const { name, description, members } = req.body; // 'members' will now be an array of usernames

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    // Check if a project with the same name already exists for this user
    const existingProject = await Project.findOne({ name, owner: req.user._id });
    if (existingProject) {
      return res.status(400).json({ message: 'A project with this name already exists for you' });
    }

    // Convert usernames to member IDs
    let memberIds = [];
    if (members && members.length > 0) {
      memberIds = await getUserIdsFromUsernames(members);
    }

    // Ensure the owner is not added as a regular member if they are already in the list
    const finalMemberIds = memberIds.filter(id => !id.equals(req.user._id));


    // Create the new project
    const project = await Project.create({
      name,
      description,
      owner: req.user._id, // Set the authenticated user as the owner
      members: finalMemberIds, // Use converted IDs
    });

    // CRITICAL FIX: After creating, find it again by ID and then populate on the query
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!populatedProject) { // Safety check
      throw new Error('Failed to find and populate newly created project.');
    }

    res.status(201).json(populatedProject);

  } catch (error) {
    console.error('Error creating project (caught in catch block):', error);
    res.status(500).json({ message: error.message || 'Server error creating project' }); // Return specific error message
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  const { name, description, members } = req.body; // 'members' will now be an array of usernames

  try {
    const project = await Project.findById(req.params.id); // This already returns a query

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only the owner can update the project details
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== project.name) {
      const existingProject = await Project.findOne({ name, owner: req.user._id });
      if (existingProject && !existingProject._id.equals(project._id)) {
        return res.status(400).json({ message: 'A project with this name already exists for you' });
      }
    }

    // Convert usernames to member IDs if members are provided
    if (members !== undefined) {
      let memberIds = [];
      if (members.length > 0) {
        memberIds = await getUserIdsFromUsernames(members);
      }
      // Ensure the owner is not added as a regular member if they are already in the list
      project.members = memberIds.filter(id => !id.equals(req.user._id));
    }

    project.name = name || project.name;
    project.description = description || project.description;

    const updatedProject = await project.save(); // This returns the updated document

    // CRITICAL FIX: After saving, find it again by ID and then populate on the query
    const populatedProject = await Project.findById(updatedProject._id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!populatedProject) { // Safety check
      throw new Error('Failed to find and populate updated project.');
    }

    res.status(200).json(populatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: error.message || 'Server error updating project' }); // Return specific error message
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only the owner can delete the project
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.deleteOne(); // Use deleteOne() for Mongoose 6+

    res.status(200).json({ message: 'Project removed' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

// @desc    Get project dashboard summary (task counts by status and assignee)
// @route   GET /api/projects/:projectId/dashboard-summary
// @access  Private
const getProjectDashboardSummary = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  try {
    // First, check if the user is authorized to view this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const isAuthorized = project.owner.equals(req.user._id) || project.members.some(member => member.equals(req.user._id));
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this project dashboard' });
    }

    // Aggregation pipeline to count tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Aggregation pipeline to count tasks by assigned user
    const tasksByAssignee = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: 'users', // The collection name for the User model
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assigneeInfo'
        }
      },
      { $unwind: { path: '$assigneeInfo', preserveNullAndEmptyArrays: true } }, // Unwind to handle unassigned tasks
      {
        $group: {
          _id: '$assignedTo',
          username: { $first: '$assigneeInfo.username' }, // Get username
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          assigneeId: '$_id',
          username: { $ifNull: ['$username', 'Unassigned'] }, // Handle null assignedTo
          count: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      tasksByStatus,
      tasksByAssignee,
    });

  } catch (error) {
    console.error('Error fetching project dashboard summary:', error);
    res.status(500).json({ message: 'Server error fetching dashboard summary' });
  }
};


module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectDashboardSummary, // Export the new function
};