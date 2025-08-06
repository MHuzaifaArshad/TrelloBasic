// backend/routes/taskRoutes.js
const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskAttachment, 
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); 

const router = express.Router();


router.use(protect);

router.route('/projects/:projectId/tasks')
  .get(getTasks)
  .post(createTask);

router.route('/tasks/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);


router.post('/tasks/:taskId/upload', upload.single('attachment'), uploadTaskAttachment);


module.exports = router;