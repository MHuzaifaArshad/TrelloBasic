// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // Create an Express router instance
const { registerUser, loginUser, logoutUser } = require('../controllers/authController'); // Import controller functions

// Define the route for user registration (POST request)
router.post('/register', registerUser);

// Define the route for user login (POST request)
router.post('/login', loginUser);

// Define the route for user logout (GET request)
router.get('/logout', logoutUser);

module.exports = router; // Export the router instance for use in server.js
