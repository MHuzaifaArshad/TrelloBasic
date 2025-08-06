// backend/controllers/projectController.js
const Project = require('../models/Project'); 
const User = require('../models/User');     
const Task = require('../models/Task');     
const mongoose = require('mongoose');       

// @desc    Get all projects for the authenticated user (owner or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
   
    const projects = await Project.find({
      $or: [
        { owner: req.user._id }, 
        { members: req.user._id } 
      ]
    })
    .populate('owner', 'username email') 
    .populate('members', 'username email'); 

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
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    
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
  const { name, description, members } = req.body; 

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {

    const existingProject = await Project.findOne({ name, owner: req.user._id });
    if (existingProject) {
      return res.status(400).json({ message: 'A project with this name already exists for you' });
    }

    let memberIds = [];
    if (members && members.length > 0) {
      memberIds = await getUserIdsFromUsernames(members);
    }

    const finalMemberIds = memberIds.filter(id => !id.equals(req.user._id));


    const project = await Project.create({
      name,
      description,
      owner: req.user._id, 
      members: finalMemberIds, 
    });

    
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!populatedProject) { 
      throw new Error('Failed to find and populate newly created project.');
    }

    res.status(201).json(populatedProject);

  } catch (error) {
    console.error('Error creating project (caught in catch block):', error);
    res.status(500).json({ message: error.message || 'Server error creating project' }); 
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project ID format' });
  }

  const { name, description, members } = req.body; 

  try {
    const project = await Project.findById(req.params.id); 

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    
    if (name && name !== project.name) {
      const existingProject = await Project.findOne({ name, owner: req.user._id });
      if (existingProject && !existingProject._id.equals(project._id)) {
        return res.status(400).json({ message: 'A project with this name already exists for you' });
      }
    }

    
    if (members !== undefined) {
      let memberIds = [];
      if (members.length > 0) {
        memberIds = await getUserIdsFromUsernames(members);
      }
      
      project.members = memberIds.filter(id => !id.equals(req.user._id));
    }

    project.name = name || project.name;
    project.description = description || project.description;

    const updatedProject = await project.save(); 


    const populatedProject = await Project.findById(updatedProject._id)
      .populate('owner', 'username email')
      .populate('members', 'username email');

    if (!populatedProject) { 
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

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.deleteOne(); 

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
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const isAuthorized = project.owner.equals(req.user._id) || project.members.some(member => member.equals(req.user._id));
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this project dashboard' });
    }

    
    const tasksByStatus = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    
    const tasksByAssignee = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: 'users', 
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assigneeInfo'
        }
      },
      { $unwind: { path: '$assigneeInfo', preserveNullAndEmptyArrays: true } }, // Unwind to handle unassigned tasks
      {
        $group: {
          _id: '$assignedTo',
          username: { $first: '$assigneeInfo.username' }, 
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          assigneeId: '$_id',
          username: { $ifNull: ['$username', 'Unassigned'] }, 
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
  getProjectDashboardSummary, 
};