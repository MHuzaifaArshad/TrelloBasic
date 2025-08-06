// backend/routes/projectRoutes.js
const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectDashboardSummary, 
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.get('/:projectId/dashboard-summary', getProjectDashboardSummary);

module.exports = router;