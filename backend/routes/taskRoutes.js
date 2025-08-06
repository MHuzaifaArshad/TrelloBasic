// backend/routes/taskRoutes.js
const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskAttachment, // Import the upload function
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import the upload middleware

const router = express.Router();

// All task routes will be protected
router.use(protect);

// Routes for tasks within a project (GET all, POST new)
router.route('/projects/:projectId/tasks')
  .get(getTasks)
  .post(createTask);

// Routes for individual tasks (GET by ID, PUT update, DELETE)
router.route('/tasks/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Route for uploading attachments to a task
// 'attachment' is the name of the field in the form data that holds the file
router.post('/tasks/:taskId/upload', upload.single('attachment'), uploadTaskAttachment);


module.exports = router;