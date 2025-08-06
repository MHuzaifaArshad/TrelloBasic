const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIo } = require('../utils/socket');
const mongoose = require('mongoose');

// Helper function to safely parse and validate assignedTo ID
const parseAssignedTo = (assignedToValue) => {
  if (assignedToValue === null || assignedToValue === '') {
    return null; // Explicitly unassigned
  }

  // Try to parse as JSON first, in case it's a stringified object
  try {
    const parsed = JSON.parse(assignedToValue);
    if (parsed && typeof parsed === 'object' && parsed._id) {
      // If it's an object with an _id, use that _id
      if (mongoose.Types.ObjectId.isValid(parsed._id)) {
        return parsed._id;
      }
    }
  } catch (e) {
    // Not a valid JSON string, proceed as if it's a plain string
  }

  // If not a stringified object, or JSON parsing failed, treat as a direct ID string
  if (mongoose.Types.ObjectId.isValid(assignedToValue)) {
    return assignedToValue;
  }

  // If none of the above, it's invalid
  console.warn(`TaskController: Attempted to parse invalid assignedTo value: ${assignedToValue}`);
  return null; // Return null for invalid values to prevent CastError
};


// Helper function to create a notification
const createNotification = async (recipientId, senderId, projectId, taskId, type, message) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.error('Notification Helper: Invalid recipientId for notification:', recipientId);
      return;
    }
    console.log(`Notification Helper: Creating notification for recipient ${recipientId}`);

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      project: projectId,
      task: taskId,
      type,
      message,
      isRead: false,
    });
    const savedNotification = await notification.save();
    console.log('Notification Helper: Notification saved to DB:', savedNotification._id);

    await savedNotification.populate('sender', 'username');
    await savedNotification.populate('project', 'name');
    await savedNotification.populate('task', 'title');

    const io = getIo();
    if (io) {
      io.to(recipientId.toString()).emit('newNotification', savedNotification);
      console.log(`Notification Helper: Emitted 'newNotification' to room ${recipientId.toString()}`);
    } else {
      console.error('Notification Helper: Socket.io instance not available, cannot emit notification.');
    }
  } catch (err) {
    console.error('Notification Helper: Error creating or emitting notification:', err);
  }
};

// @desc Get all tasks for a specific project
// @route GET /api/projects/:projectId/tasks
// @access Private
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search, status } = req.query;

    let query = { project: projectId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');
    res.status(200).json(tasks);
  } catch (error) {
    console.error('TaskController: Error getting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get a single task by ID
// @route GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('TaskController: Error getting task by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Create a new task
// @route POST /api/projects/:projectId/tasks
// @access Private
const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate, priority } = req.body;
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const validatedAssignedTo = parseAssignedTo(assignedTo);
    if (assignedTo !== null && assignedTo !== '' && validatedAssignedTo === null) {
      return res.status(400).json({ message: 'Invalid assigned user ID provided.' });
    }

    const newTask = new Task({
      project: projectId,
      title,
      description,
      status: status || 'To Do',
      assignedTo: validatedAssignedTo,
      dueDate,
      priority: priority || 'Medium',
      createdBy: req.user.id,
    });

    const savedTask = await newTask.save();
    console.log('TaskController: Task created and saved:', savedTask._id);
    
    await savedTask.populate('assignedTo', 'username');
    await savedTask.populate('createdBy', 'username');

    const io = getIo();
    if (io) {
      io.to(projectId).emit('taskCreated', savedTask);
      console.log(`TaskController: Emitted 'taskCreated' to project room ${projectId}`);
    } else {
      console.error('TaskController: Socket.io instance not available for taskCreated emit.');
    }

    if (savedTask.assignedTo && !savedTask.assignedTo.equals(req.user._id)) {
        const assignedUser = await User.findById(savedTask.assignedTo);
        if (assignedUser) {
            await createNotification(
                assignedUser._id,
                req.user._id,
                projectId,
                savedTask._id,
                'task_assigned',
                `You've been assigned to new task: "${savedTask.title}" in project "${project.name}".`
            );
        }
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('TaskController: Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Update a task
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { assignedTo, ...otherUpdates } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldStatus = task.status;
    const oldAssignedToId = task.assignedTo ? task.assignedTo.toString() : null; 
    const oldTitle = task.title;
    const oldDescription = task.description;
    const oldPriority = task.priority;
    const oldDueDate = task.dueDate ? task.dueDate.toISOString() : null;

    Object.assign(task, otherUpdates);

    if (assignedTo !== undefined) {
      const validatedAssignedTo = parseAssignedTo(assignedTo);
      if (assignedTo !== null && assignedTo !== '' && validatedAssignedTo === null) {
        return res.status(400).json({ message: 'Invalid assigned user ID provided.' });
      }
      task.assignedTo = validatedAssignedTo;
    }

    const updatedTask = await task.save();
    console.log('TaskController: Task updated and saved:', updatedTask._id);

    await updatedTask.populate('assignedTo', 'username');
    await updatedTask.populate('createdBy', 'username');
    
    const io = getIo();
    if (io) {
      io.to(updatedTask.project.toString()).emit('taskUpdated', updatedTask);
      console.log(`TaskController: Emitted 'taskUpdated' to project room ${updatedTask.project.toString()}`);
    } else {
      console.error('TaskController: Socket.io instance not available for taskUpdated emit.');
    }

    const project = await Project.findById(updatedTask.project);
    const senderUsername = req.user.username;

    const newAssignedToId = updatedTask.assignedTo ? updatedTask.assignedTo._id.toString() : null;

    // Case 1: Assignment change notification
    if (oldAssignedToId !== newAssignedToId) {
      if (newAssignedToId && newAssignedToId !== req.user._id.toString()) {
        await createNotification(
            updatedTask.assignedTo._id,
            req.user._id,
            project._id,
            updatedTask._id,
            'task_assigned',
            `You've been assigned to task: "${updatedTask.title}" in project "${project.name}".`
        );
      }
      if (oldAssignedToId && oldAssignedToId !== req.user._id.toString()) {
        await createNotification(
            oldAssignedToId,
            req.user._id,
            project._id,
            updatedTask._id,
            'task_unassigned',
            `You've been unassigned from task: "${updatedTask.title}" in project "${project.name}".`
        );
      }
    }

    // Case 2: Other changes to an *already assigned* task (notify the current assignee)
    if (updatedTask.assignedTo && updatedTask.assignedTo._id.toString() !== req.user._id.toString()) {
        let message = '';
        let notificationType = 'task_updated';

        if (oldStatus !== updatedTask.status) {
            message = `${senderUsername} changed status of your task "${updatedTask.title}" to "${updatedTask.status}" in project "${project.name}".`;
            notificationType = 'task_status_change';
        } else if (
            oldTitle !== updatedTask.title ||
            oldDescription !== updatedTask.description ||
            oldPriority !== updatedTask.priority ||
            (oldDueDate !== (updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null))
        ) {
            message = `${senderUsername} updated details of your task: "${updatedTask.title}" in project "${project.name}".`;
            notificationType = 'task_updated';
        }

        if (message) {
            await createNotification(
                updatedTask.assignedTo._id,
                req.user._id,
                project._id,
                updatedTask._id,
                notificationType,
                message
            );
        }
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('TaskController: Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Delete a task
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const projectId = task.project.toString();
    const taskTitle = task.title;
    const assignedToId = task.assignedTo ? task.assignedTo.toString() : null;

    await task.deleteOne();
    console.log('TaskController: Task deleted:', id);

    const io = getIo();
    if (io) {
      io.to(projectId).emit('taskDeleted', id);
      console.log(`TaskController: Emitted 'taskDeleted' to project room ${projectId}`);
    } else {
      console.error('TaskController: Socket.io instance not available for taskDeleted emit.');
    }

    if (assignedToId && assignedToId !== req.user._id.toString()) {
        const assignedUser = await User.findById(assignedToId);
        const project = await Project.findById(projectId);
        if (assignedUser && project) {
            await createNotification(
                assignedUser._id,
                req.user._id,
                projectId,
                null,
                'task_deleted',
                `Your assigned task: "${taskTitle}" was deleted by ${req.user.username} from project "${project.name}".`
            );
        }
    }

    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    console.error('TaskController: Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Upload file to a task (Cloudinary version)
// @route POST /api/tasks/:taskId/upload
// @access Private
const uploadTaskAttachment = async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: 'Invalid task ID format' });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.file) {
      console.error('TaskController: No file found in req.file after Multer processing.');
      return res.status(400).json({ message: 'No file uploaded or file processing failed.' });
    }

    if (!req.file.path) {
        console.error('TaskController: Cloudinary did not return a file path (req.file.path) for the uploaded file:', req.file);
        return res.status(500).json({ message: 'Failed to get Cloudinary URL for the uploaded file.' });
    }

    const newAttachment = {
      filename: req.file.originalname,
      filePath: req.file.path,
      mimetype: req.file.mimetype,
    };

    task.attachments.push(newAttachment);
    const updatedTask = await task.save();
    console.log('TaskController: Attachment uploaded and task updated:', updatedTask._id);


    await updatedTask.populate('assignedTo', 'username');
    await updatedTask.populate('createdBy', 'username');

    const io = getIo();
    if (io) {
      io.to(task.project.toString()).emit('taskUpdated', updatedTask);
      console.log(`TaskController: Emitted 'taskUpdated' (attachment) to project room ${task.project.toString()}`);
    } else {
      console.error('TaskController: Socket.io instance not available for attachment taskUpdated emit.');
    }

    if (updatedTask.assignedTo && updatedTask.assignedTo._id.toString() !== req.user._id.toString()) {
        const assignedUser = await User.findById(updatedTask.assignedTo._id);
        const project = await Project.findById(task.project);
        if (assignedUser && project) {
            await createNotification(
                assignedUser._id,
                req.user._id,
                project._id,
                task._id,
                'task_updated',
                `${req.user.username} added an attachment to your task: "${task.title}" in project "${project.name}".`
            );
        }
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      attachment: newAttachment,
      task: updatedTask,
    });
  } catch (error) {
    console.error('TaskController: Error uploading task attachment:', error);
    res.status(500).json({ message: error.message || 'Server error uploading file' });
  }
};


module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskAttachment,
};
