// backend/routes/projectRoutes.js
const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectDashboardSummary, // NEW: Import the new controller function
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware

const router = express.Router();

// All project routes will be protected
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// NEW: Route for project dashboard summary
router.get('/:projectId/dashboard-summary', getProjectDashboardSummary);

module.exports = router;